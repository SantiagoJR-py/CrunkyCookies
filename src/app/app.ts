import { Component, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Cookie {
  id: string;
  name: string;
  description: string;
  illustrationId: 'chocochip' | 'doblechoco' | 'redvelvet' | 'oreo' | 'manichoco' | 'nutella';
  highlight?: boolean;
}

interface Review {
  name: string;
  text: string;
  initial: string;
  badge: string;
}

interface OrderItem {
  cookieId: string;
  qty: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Crunky Cookies');
  protected readonly whatsappNumber = '573243300085';
  protected readonly whatsappDisplay = '+57 324 330 0085';

  protected readonly cookies = signal<Cookie[]>([
    {
      id: 'chocochip',
      name: 'Chocolate Chip Clásica',
      description: 'La original neoyorkina: chips de chocolate semi-amargo y centro suave.',
      illustrationId: 'chocochip',
    },
    {
      id: 'doblechoco',
      name: 'Doble Chocolate',
      description: 'Masa de cacao intenso con trozos de chocolate negro derretido.',
      illustrationId: 'doblechoco',
    },
    {
      id: 'redvelvet',
      name: 'Red Velvet',
      description: 'Suave terciopelo rojo con chips de chocolate blanco artesanal.',
      illustrationId: 'redvelvet',
    },
    {
      id: 'nutella',
      name: 'Nutella Rellena',
      description: 'Centro fluido de Nutella escondido en una galleta crujiente.',
      illustrationId: 'nutella',
    },
    {
      id: 'oreo',
      name: 'Cookies & Cream',
      description: 'Trozos generosos de Oreo en masa de vainilla cremosa.',
      illustrationId: 'oreo',
    },
    {
      id: 'manichoco',
      name: 'Maní y Chocolate',
      description: 'Mantequilla de maní con chips de chocolate. El combo perfecto.',
      illustrationId: 'manichoco',
    },
  ]);

  protected readonly reviews = signal<Review[]>([
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
  ]);

  protected readonly form = signal({
    nombre: '',
    fecha: '',
    barrio: '',
    notas: '',
  });

  protected readonly selectedFlavors = signal<Record<string, number>>({});

  protected readonly totalSelected = computed(() => {
    const selected = this.selectedFlavors();
    return Object.values(selected).reduce((sum, qty) => sum + qty, 0);
  });

  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  protected readonly minDate = (() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  })();

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 40);
  }

  protected scrollTo(id: string) {
    this.menuOpen.set(false);
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  protected toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  protected addFlavor(cookieId: string) {
    this.selectedFlavors.update((current) => ({
      ...current,
      [cookieId]: (current[cookieId] ?? 0) + 1,
    }));
  }

  protected removeFlavor(cookieId: string) {
    this.selectedFlavors.update((current) => {
      const qty = (current[cookieId] ?? 0) - 1;
      const next = { ...current };
      if (qty <= 0) {
        delete next[cookieId];
      } else {
        next[cookieId] = qty;
      }
      return next;
    });
  }

  protected getQty(cookieId: string): number {
    return this.selectedFlavors()[cookieId] ?? 0;
  }

  protected updateForm<K extends keyof ReturnType<typeof this.form>>(
    key: K,
    value: ReturnType<typeof this.form>[K],
  ) {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected pickFlavorAndScroll(cookieId: string) {
    this.addFlavor(cookieId);
    this.scrollTo('contacto');
  }

  protected goCustomize() {
    this.scrollTo('contacto');
    setTimeout(() => {
      this.updateForm('notas', 'Quiero personalizar mi pedido: ');
      const el = document.getElementById('notas');
      if (el) (el as HTMLTextAreaElement).focus();
    }, 600);
  }

  protected submitOrder(event: Event) {
    event.preventDefault();
    const data = this.form();
    const flavors = this.selectedFlavors();
    const cookies = this.cookies();

    const flavorLines = Object.entries(flavors)
      .map(([id, qty]) => {
        const c = cookies.find((x) => x.id === id);
        return c ? `• ${c.name} x${qty}` : null;
      })
      .filter(Boolean)
      .join('\n');

    const flavorBlock =
      flavorLines.length > 0
        ? `🍪 *Sabores que quiero:*\n${flavorLines}\n`
        : '🍪 *Sabores:* (los hablamos por aquí)\n';

    const totalLine =
      this.totalSelected() > 0 ? `📦 *Total galletas:* ${this.totalSelected()}` : '';

    const message = [
      `¡Hola Crunky! 👋`,
      ``,
      `Quiero hacer un pedido:`,
      ``,
      `👤 *Nombre:* ${data.nombre || '(por escribir)'}`,
      flavorBlock,
      totalLine,
      `📅 *Fecha de entrega:* ${data.fecha || '(por confirmar)'}`,
      `📍 *Barrio:* ${data.barrio || '(por confirmar)'}`,
      data.notas ? `📝 *Notas:* ${data.notas}` : '',
      ``,
      `¿Me confirmas precio total y disponibilidad? 🤎`,
    ]
      .filter((line) => line !== '')
      .join('\n');

    const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected openWhatsAppDirect() {
    const message = `¡Hola Crunky! 👋 Quiero pedir galletas. ¿Me cuentas qué sabores tienes disponibles hoy?`;
    const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
