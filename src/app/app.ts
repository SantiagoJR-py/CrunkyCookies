import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FLAVORS, Flavor, FlavorId } from './flavors';
import { Icon } from './icon';
import { Reveal } from './reveal';
import type { HeroScene } from './three/hero-scene';

interface Review {
  name: string;
  text: string;
  initial: string;
  badge: string;
}

interface Faq {
  q: string;
  a: string;
}

interface OrderForm {
  nombre: string;
  fecha: string;
  barrio: string;
  notas: string;
}

interface MessageLine {
  label?: string;
  text: string;
  /** Línea en blanco antes de esta. */
  gap?: boolean;
}

const STORAGE_KEY = 'crunky-pedido-v1';
const HERO_CYCLE_MS = 6500;
const RING_TEXT = 'HECHAS A MANO · ESTILO NEW YORK · GIRARDOT · CRUNKY COOKIES · ';

@Component({
  selector: 'app-root',
  imports: [Icon, Reveal],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class App {
  protected readonly whatsappNumber = '573043432348';
  protected readonly whatsappDisplay = '+57 304 343 2348';
  protected readonly instagramUrl = 'https://instagram.com/crunkycookies.co';
  protected readonly year = 2026;

  protected readonly flavors = FLAVORS;
  protected readonly ringChars = RING_TEXT.split('');
  protected readonly marquee = [
    'Suaves por dentro',
    'Crujientes por fuera',
    'Hechas a mano',
    'Estilo New York',
    'Horneadas en Girardot',
    'Pide por WhatsApp',
  ];

  protected readonly reviews: Review[] = [
    {
      name: 'Valentina G.',
      text: 'Las mejores galletas que he probado en Girardot. Pedí la Nutella rellena y quedé OBSESIONADA. Llegan calientitas y se sienten artesanales de verdad.',
      initial: 'V',
      badge: 'Centro',
    },
    {
      name: 'Andrés M.',
      text: 'Pedí una caja para el cumpleaños de mi novia y fueron el éxito de la fiesta. Suaves por dentro, crujientes por fuera. Tal cual lo prometen.',
      initial: 'A',
      badge: 'Kennedy',
    },
    {
      name: 'Camila R.',
      text: 'Probé las personalizadas para un baby shower y quedaron increíbles. Atención por WhatsApp súper rápida y el detalle del empaque es hermoso.',
      initial: 'C',
      badge: 'San Miguel',
    },
  ];

  protected readonly faqs: Faq[] = [
    {
      q: '¿Cómo hago un pedido de galletas?',
      a: 'Elige tus sabores aquí en la página, toca “Enviar pedido por WhatsApp” y se abre el chat con tu pedido ya escrito. Te confirmamos disponibilidad, precio total y fecha de entrega.',
    },
    {
      q: '¿Hacen domicilios en Girardot?',
      a: 'Sí. Entregamos en toda la ciudad de Girardot, con un empaque pensado para que las galletas lleguen frescas y con su textura intacta.',
    },
    {
      q: '¿Con cuánta anticipación debo pedir?',
      a: 'Lo ideal es pedir con un día de anticipación para hornear tus galletas frescas. Si las necesitas antes, escríbenos por WhatsApp y te contamos qué hay disponible.',
    },
    {
      q: '¿Puedo personalizar las galletas para un evento?',
      a: 'Claro. Hacemos galletas personalizadas para cumpleaños, baby showers, regalos y eventos. Cuéntanos tu idea por WhatsApp y la hacemos realidad.',
    },
    {
      q: '¿Cuánto cuestan las galletas?',
      a: 'El precio depende de los sabores y la cantidad. Envíanos tu pedido por WhatsApp y te confirmamos el total antes de hornear, sin compromiso.',
    },
    {
      q: '¿Cuál es el horario de atención?',
      a: 'Atendemos de lunes a sábado, de 9:00 a. m. a 7:00 p. m. Respondemos los mensajes de WhatsApp en minutos.',
    },
  ];

  /* ---------- estado ---------- */

  protected readonly qty = signal<Partial<Record<FlavorId, number>>>({});
  protected readonly form = signal<OrderForm>({ nombre: '', fecha: '', barrio: '', notas: '' });
  protected readonly minDate = signal('');

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly orderInView = signal(false);
  protected readonly footerInView = signal(false);
  protected readonly justAdded = signal<FlavorId | null>(null);

  protected readonly heroIndex = signal(0);
  protected readonly sceneReady = signal(false);
  protected readonly heroFlavor = computed<Flavor>(() => this.flavors[this.heroIndex()]);

  protected readonly total = computed(() =>
    Object.values(this.qty()).reduce<number>((sum, n) => sum + (n ?? 0), 0),
  );

  protected readonly selected = computed(() => {
    const qty = this.qty();
    return this.flavors.filter((f) => (qty[f.id] ?? 0) > 0).map((f) => ({ flavor: f, qty: qty[f.id]! }));
  });

  protected readonly showCartBar = computed(() => this.total() > 0 && !this.orderInView() && !this.footerInView());

  /** Mensaje de WhatsApp, línea por línea (se usa para la vista previa y el enlace). */
  protected readonly messageLines = computed<MessageLine[]>(() => {
    const form = this.form();
    const selected = this.selected();
    const total = this.total();
    const lines: MessageLine[] = [{ text: '¡Hola Crunky! 👋 Quiero hacer un pedido:' }];

    if (selected.length) {
      lines.push({ label: '🍪 Mis galletas', text: '', gap: true });
      for (const item of selected) lines.push({ text: `• ${item.flavor.name} x${item.qty}` });
      lines.push({ label: '📦 Total', text: `${total} ${total === 1 ? 'galleta' : 'galletas'}` });
    } else {
      lines.push({ label: '🍪 Sabores', text: 'los definimos por aquí', gap: true });
    }

    const details: MessageLine[] = [];
    if (form.nombre.trim()) details.push({ label: '👤 Nombre', text: form.nombre.trim() });
    if (form.fecha) details.push({ label: '📅 Entrega', text: this.prettyDate(form.fecha) });
    if (form.barrio.trim()) details.push({ label: '📍 Barrio', text: form.barrio.trim() });
    if (form.notas.trim()) details.push({ label: '📝 Notas', text: form.notas.trim() });
    if (details.length) {
      details[0].gap = true;
      lines.push(...details);
    }

    lines.push({ text: '¿Me confirmas precio y disponibilidad? 🤎', gap: true });
    return lines;
  });

  protected readonly orderUrl = computed(() => {
    const text = this.messageLines()
      .map((line) => {
        const body = line.label ? `*${line.label}:*${line.text ? ' ' + line.text : ''}` : line.text;
        return (line.gap ? '\n' : '') + body;
      })
      .join('\n');
    return this.waLink(text);
  });

  protected readonly directUrl = this.waLink(
    '¡Hola Crunky! 👋 Quiero pedir galletas. ¿Me cuentas qué sabores tienes disponibles hoy?',
  );

  protected readonly customUrl = this.waLink(
    '¡Hola Crunky! 👋 Quiero unas galletas personalizadas. Te cuento mi idea:',
  );

  /* ---------- escena 3D ---------- */

  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly orderSection = viewChild<ElementRef<HTMLElement>>('orderSection');
  private readonly footer = viewChild<ElementRef<HTMLElement>>('footer');
  private readonly notes = viewChild<ElementRef<HTMLTextAreaElement>>('notes');

  private scene: HeroScene | null = null;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private addedTimer: ReturnType<typeof setTimeout> | null = null;
  private restored = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.minDate.set(this.tomorrow());
      this.restore();
      this.onScroll();
      this.watchSections(destroyRef);
      this.startScene(destroyRef);
    });

    // Guarda el pedido para que no se pierda al recargar.
    effect(() => {
      const snapshot = JSON.stringify({ qty: this.qty(), form: this.form() });
      if (!this.restored) return;
      try {
        localStorage.setItem(STORAGE_KEY, snapshot);
      } catch {
        /* almacenamiento no disponible: se ignora */
      }
    });

    effect(() => {
      const id = this.heroFlavor().id;
      this.scene?.setFlavor(id);
    });

    destroyRef.onDestroy(() => {
      this.stopCycle();
      this.scene?.destroy();
      if (this.addedTimer) clearTimeout(this.addedTimer);
    });
  }

  /* ---------- navegación ---------- */

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  protected go(event: Event | null, id: string): void {
    event?.preventDefault();
    this.menuOpen.set(false);
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /* ---------- pedido ---------- */

  protected count(id: FlavorId): number {
    return this.qty()[id] ?? 0;
  }

  protected add(id: FlavorId): void {
    this.qty.update((current) => ({ ...current, [id]: Math.min(99, (current[id] ?? 0) + 1) }));
    this.justAdded.set(id);
    if (this.addedTimer) clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.justAdded.set(null), 700);
  }

  protected remove(id: FlavorId): void {
    this.qty.update((current) => {
      const next = { ...current };
      const value = (next[id] ?? 0) - 1;
      if (value <= 0) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  protected clearOrder(): void {
    this.qty.set({});
  }

  protected setField(key: keyof OrderForm, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected customize(event: Event): void {
    this.go(event, 'pedido');
    if (!this.form().notas.trim()) {
      this.form.update((current) => ({ ...current, notas: 'Quiero personalizar mi pedido: ' }));
    }
    setTimeout(() => {
      const el = this.notes()?.nativeElement;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    }, 700);
  }

  /* ---------- hero ---------- */

  protected pickHero(index: number, byUser = true): void {
    const count = this.flavors.length;
    this.heroIndex.set(((index % count) + count) % count);
    if (byUser) this.stopCycle();
  }

  protected addHero(): void {
    this.stopCycle();
    this.add(this.heroFlavor().id);
  }

  private startScene(destroyRef: DestroyRef): void {
    const stage = this.stage()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;
    if (!stage || !canvas || !this.hasWebGL()) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cancelled = false;
    destroyRef.onDestroy(() => (cancelled = true));

    const load = async () => {
      try {
        const { HeroScene } = await import('./three/hero-scene');
        if (cancelled) return;
        this.scene = new HeroScene(canvas, canvas, {
          flavor: this.heroFlavor().id,
          reducedMotion,
          onReady: () => this.sceneReady.set(true),
          onInteract: () => this.stopCycle(),
        });
        if (!reducedMotion) this.startCycle();
      } catch (err) {
        console.warn('No se pudo iniciar la galleta 3D; se muestra la imagen estática.', err);
      }
    };

    // Deja pintar primero el contenido; el 3D se carga aparte.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
      .requestIdleCallback;
    if (idle) idle(() => void load(), { timeout: 1500 });
    else setTimeout(() => void load(), 300);
  }

  private startCycle(): void {
    this.stopCycle();
    this.cycleTimer = setInterval(() => {
      if (document.hidden || window.scrollY > window.innerHeight * 0.6) return;
      this.pickHero(this.heroIndex() + 1, false);
    }, HERO_CYCLE_MS);
  }

  private stopCycle(): void {
    if (this.cycleTimer) clearInterval(this.cycleTimer);
    this.cycleTimer = null;
  }

  private hasWebGL(): boolean {
    try {
      const probe = document.createElement('canvas');
      return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch {
      return false;
    }
  }

  /* ---------- utilidades ---------- */

  private watchSections(destroyRef: DestroyRef): void {
    if (!('IntersectionObserver' in window)) return;
    const order = this.orderSection()?.nativeElement;
    const footer = this.footer()?.nativeElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === order) this.orderInView.set(entry.isIntersecting);
          if (entry.target === footer) this.footerInView.set(entry.isIntersecting);
        }
      },
      { threshold: 0.12 },
    );
    if (order) io.observe(order);
    if (footer) io.observe(footer);
    destroyRef.onDestroy(() => io.disconnect());
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { qty?: Record<string, unknown>; form?: Partial<OrderForm> };
        const qty: Partial<Record<FlavorId, number>> = {};
        for (const flavor of this.flavors) {
          const n = Number(saved.qty?.[flavor.id]);
          if (Number.isInteger(n) && n > 0) qty[flavor.id] = Math.min(99, n);
        }
        this.qty.set(qty);
        const form = saved.form ?? {};
        this.form.set({
          nombre: typeof form.nombre === 'string' ? form.nombre : '',
          fecha: typeof form.fecha === 'string' && form.fecha >= this.minDate() ? form.fecha : '',
          barrio: typeof form.barrio === 'string' ? form.barrio : '',
          notas: typeof form.notas === 'string' ? form.notas : '',
        });
      }
    } catch {
      /* datos guardados inválidos: se ignoran */
    }
    this.restored = true;
  }

  private tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private prettyDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const text = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(y, m - 1, d),
    );
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private waLink(text: string): string {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
}
