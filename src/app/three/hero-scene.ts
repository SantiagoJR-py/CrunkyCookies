import { Group, Mesh, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { FlavorId } from '../flavors';
import { BuiltCookie, buildCookie } from './cookie-factory';
import { BASE_TILT_X, BASE_TILT_Z, configureRenderer, frameCamera, lightStage } from './stage';

export interface HeroSceneOptions {
  flavor: FlavorId;
  reducedMotion: boolean;
  /** Se llama cuando el primer cuadro ya está pintado. */
  onReady?: () => void;
  /** Se llama cuando la persona arrastra la galleta. */
  onInteract?: () => void;
}

interface Bit {
  mesh: Mesh;
  radius: number;
  angle: number;
  speed: number;
  height: number;
  bob: number;
  spin: number;
}

const BIT_COUNT = 9;
const SWAP_SECONDS = 0.75;

/**
 * Galleta 3D interactiva del hero: gira sola, sigue al cursor,
 * se puede arrastrar y cambia de sabor con una transición.
 */
export class HeroScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera();
  private readonly tilt = new Group();
  private readonly spin = new Group();
  private readonly bits: Bit[] = [];
  private readonly cache = new Map<FlavorId, BuiltCookie>();
  private readonly cleanups: (() => void)[] = [];

  private current: BuiltCookie | null = null;
  private pending: FlavorId | null = null;
  private swapT = 1;
  private swapped = true;

  private raf = 0;
  private last = 0;
  private visible = true;
  private dirty = true;
  private ready = false;
  private destroyed = false;

  private spinVelocity = 0;
  private dragging = false;
  private lastX = 0;
  private pointerX = 0;
  private pointerY = 0;
  private lookX = 0;
  private lookY = 0;
  private intro = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: HTMLElement,
    private readonly options: HeroSceneOptions,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    configureRenderer(this.renderer);
    this.cleanups.push(lightStage(this.scene, this.renderer));

    this.tilt.rotation.set(BASE_TILT_X, 0, BASE_TILT_Z);
    this.tilt.add(this.spin);
    this.scene.add(this.tilt);

    this.current = this.cookie(options.flavor);
    this.spin.add(this.current.group);
    this.spin.rotation.y = 0.6;
    this.createBits();

    this.bindEvents();
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  setFlavor(id: FlavorId): void {
    if (this.destroyed) return;
    this.pending = id;
    if (this.options.reducedMotion) {
      this.swapNow();
      this.dirty = true;
      return;
    }
    if (this.swapT >= 1) {
      this.swapT = 0;
      this.swapped = false;
    }
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach((fn) => fn());
    this.cache.forEach((c) => c.dispose());
    this.cache.clear();
    this.renderer.dispose();
  }

  /* ---------- construcción ---------- */

  private cookie(id: FlavorId): BuiltCookie {
    let built = this.cache.get(id);
    if (!built) {
      built = buildCookie(id, window.innerWidth < 720 ? 40 : 52);
      this.cache.set(id, built);
    }
    return built;
  }

  private createBits(): void {
    if (!this.current) return;
    for (let i = 0; i < BIT_COUNT; i++) {
      const mesh = new Mesh(this.current.bitGeometry, this.current.bitMaterial);
      const t = i / BIT_COUNT;
      const scale = 0.07 + ((i * 37) % 10) * 0.008;
      mesh.scale.setScalar(scale);
      mesh.castShadow = false;
      this.scene.add(mesh);
      this.bits.push({
        mesh,
        radius: 1.32 + ((i * 53) % 7) * 0.055,
        angle: t * Math.PI * 2 + (i % 2) * 0.5,
        speed: 0.1 + ((i * 29) % 5) * 0.025,
        height: -0.75 + ((i * 61) % 9) * 0.19,
        bob: i * 1.7,
        spin: 0.4 + ((i * 17) % 6) * 0.15,
      });
    }
  }

  private swapNow(): void {
    if (!this.pending || !this.current) return;
    const next = this.cookie(this.pending);
    this.pending = null;
    if (next === this.current) return;
    this.spin.remove(this.current.group);
    this.spin.add(next.group);
    this.current = next;
    for (const bit of this.bits) {
      bit.mesh.geometry = next.bitGeometry;
      bit.mesh.material = next.bitMaterial;
    }
  }

  /* ---------- eventos ---------- */

  private bindEvents(): void {
    const on = <K extends keyof WindowEventMap>(
      target: Window | Document | HTMLElement,
      type: K | string,
      handler: (e: never) => void,
      opts?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, handler as EventListener, opts);
      this.cleanups.push(() => target.removeEventListener(type, handler as EventListener, opts));
    };

    on(window, 'pointermove', (e: PointerEvent) => {
      if (this.dragging) {
        const dx = e.clientX - this.lastX;
        this.lastX = e.clientX;
        this.spin.rotation.y += dx * 0.011;
        this.spinVelocity = dx * 0.6;
        this.dirty = true;
        return;
      }
      if (e.pointerType === 'touch') return;
      this.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      this.dirty = true;
    }, { passive: true });

    on(this.canvas, 'pointerdown', (e: PointerEvent) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.canvas.classList.add('is-dragging');
      this.options.onInteract?.();
    });

    const release = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.canvas.classList.remove('is-dragging');
    };
    on(window, 'pointerup', release);
    on(window, 'pointercancel', release);
    on(window, 'scroll', () => (this.dirty = true), { passive: true });
    on(document, 'visibilitychange', () => (this.last = 0));

    const resizeObserver = new ResizeObserver(() => this.resize());
    resizeObserver.observe(this.host);
    this.cleanups.push(() => resizeObserver.disconnect());

    const io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.last = 0;
    });
    io.observe(this.host);
    this.cleanups.push(() => io.disconnect());
  }

  private resize(): void {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    frameCamera(this.camera, w / h, 0.6);
    this.dirty = true;
  }

  /* ---------- animación ---------- */

  private readonly frame = (now: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    if (!this.visible || document.hidden) return;

    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    const reduced = this.options.reducedMotion;
    const animating = this.swapT < 1 || this.dragging || Math.abs(this.spinVelocity) > 0.01;
    if (reduced && !this.dirty && !animating && this.ready) return;
    this.dirty = false;

    const time = now / 1000;

    // Giro: inercia del arrastre + giro lento constante.
    if (!this.dragging) {
      this.spin.rotation.y += (reduced ? 0 : 0.22) * dt + this.spinVelocity * dt;
      this.spinVelocity *= Math.pow(0.04, dt);
    }

    // Cambio de sabor: se encoge girando, cambia y rebota.
    let scale = 1;
    if (this.swapT < 1) {
      this.swapT = Math.min(1, this.swapT + dt / SWAP_SECONDS);
      const t = this.swapT;
      if (t >= 0.5 && !this.swapped) {
        this.swapNow();
        this.swapped = true;
      }
      if (t < 0.5) {
        const k = t * 2;
        scale = 1 - k * k * 0.5;
      } else {
        const k = (t - 0.5) * 2;
        const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
        scale = 0.5 + back * 0.5;
      }
      this.spin.rotation.y += Math.sin(t * Math.PI) * 9 * dt;
      if (this.swapT >= 1 && this.pending) {
        this.swapT = 0;
        this.swapped = false;
      }
    }

    // Entrada suave.
    this.intro = Math.min(1, this.intro + dt * 1.6);
    const introEase = 1 - Math.pow(1 - this.intro, 3);
    scale *= 0.86 + 0.14 * introEase;

    // El cursor inclina la galleta; el scroll la voltea y la eleva.
    const ease = 1 - Math.pow(0.002, dt);
    this.lookX += (this.pointerX - this.lookX) * ease;
    this.lookY += (this.pointerY - this.lookY) * ease;
    const scroll = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.9)));
    const float = reduced ? 0 : Math.sin(time * 1.1) * 0.045;

    this.tilt.rotation.x = BASE_TILT_X + this.lookY * 0.16 - scroll * 0.55 + (reduced ? 0 : Math.sin(time * 0.7) * 0.03);
    this.tilt.rotation.y = this.lookX * 0.22;
    this.tilt.rotation.z = BASE_TILT_Z + scroll * 0.25;
    this.tilt.position.y = float + scroll * 0.35;
    this.tilt.scale.setScalar(scale);

    for (const bit of this.bits) {
      if (!reduced) bit.angle += bit.speed * dt;
      const wobble = reduced ? 0 : Math.sin(time * 0.9 + bit.bob) * 0.09;
      bit.mesh.position.set(
        Math.cos(bit.angle) * bit.radius + this.lookX * 0.08,
        bit.height + wobble + scroll * (0.3 + bit.radius * 0.3),
        Math.sin(bit.angle) * bit.radius * 0.55,
      );
      if (!reduced) {
        bit.mesh.rotation.x += bit.spin * dt;
        bit.mesh.rotation.y += bit.spin * 0.7 * dt;
      }
    }

    this.renderer.render(this.scene, this.camera);
    if (!this.ready) {
      this.ready = true;
      this.options.onReady?.();
    }
  };
}
