import { Directive, ElementRef, OnDestroy, afterNextRender, inject, input } from '@angular/core';

let observer: IntersectionObserver | null = null;

function sharedObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  return observer;
}

/**
 * Aparece suavemente al entrar en pantalla. El contenido es visible por defecto
 * (HTML prerenderizado / sin JS); solo se oculta lo que aún no se ha visto.
 */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnDestroy {
  /** Retraso en milisegundos para escalonar elementos hermanos. */
  readonly appReveal = input<number | ''>('');
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    afterNextRender(() => {
      if (!('IntersectionObserver' in window)) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = this.el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) return; // ya visible: no lo escondas
      const delay = this.appReveal();
      if (typeof delay === 'number' && delay > 0) this.el.style.transitionDelay = `${delay}ms`;
      this.el.classList.add('reveal');
      sharedObserver().observe(this.el);
    });
  }

  ngOnDestroy(): void {
    observer?.unobserve(this.el);
  }
}
