import { RenderMode, ServerRoute } from '@angular/ssr';

/** Toda la página se prerenderiza a HTML estático en el build (mejor SEO y carga). */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
