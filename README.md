# Crunky Cookies — Web oficial

Sitio one-page para **Crunky Cookies**, galletas estilo New York hechas a mano en Girardot (Cundinamarca).
El recorrido es lineal: el visitante llega → ve las galletas → arma su pedido → lo envía por WhatsApp.

## Stack

- **Angular 20** (standalone, signals, zoneless) con **prerenderizado estático**: el HTML sale completo en el build, lo que mejora SEO y velocidad de carga.
- **Three.js** para la galleta 3D interactiva del hero. Se carga aparte (lazy), así no frena la primera pintura.
- **CSS puro** con variables de marca (`src/styles.css`) y estilos de página (`src/app/app.css`).
- **Google Fonts**: Fraunces (títulos) + DM Sans (texto).

## Estructura

| Archivo | Qué contiene |
| --- | --- |
| `src/app/flavors.ts` | Los sabores: nombre, descripción, colores e imagen. **Aquí se agregan o editan galletas.** |
| `src/app/app.ts` / `app.html` / `app.css` | La página y el flujo de pedido. |
| `src/app/three/cookie-factory.ts` | Galleta 3D procedural (forma, masa y toppings de cada sabor). |
| `src/app/three/hero-scene.ts` | Escena interactiva del hero (giro, arrastre, cambio de sabor). |
| `src/index.html` | Título, descripción, Open Graph y datos estructurados (SEO). |
| `scripts/render-assets.mjs` | Genera las imágenes de galletas, los iconos y la imagen para compartir. |

## Secciones de la página

1. **Header** flotante con acceso a "Mi pedido" (muestra cuántas galletas llevas).
2. **Hero** con la galleta 3D: se arrastra para girarla y se puede cambiar de sabor y agregarlo al pedido.
3. **Sabores**: tarjetas con botón Agregar y contador +/−. En móvil se muestran como lista compacta.
4. **¿Qué es Crunky?**, **Cómo pedir** (3 pasos) y **Reseñas**.
5. **Pedido**: selector de galletas, datos opcionales y una **vista previa del mensaje de WhatsApp** tal como llegará.
6. **Preguntas frecuentes** y **footer**.
7. **Barra de pedido** fija (aparece al agregar galletas) y botón flotante de WhatsApp.

El pedido se guarda en el navegador (`localStorage`), así no se pierde al recargar.

## Comandos

Requiere Node.js 20.19+ o 22.12+.

```bash
npm install        # Instala dependencias
npm start          # Servidor de desarrollo en http://localhost:4200
npm run build      # Build de producción en dist/crunky_cookies/browser
npm test           # Tests unitarios
npm run assets     # Regenera imágenes de galletas, iconos y og-image.jpg (necesita Google Chrome)
```

Ejecuta `npm run assets` después de cambiar el aspecto de una galleta en `cookie-factory.ts` o de agregar un sabor.

## SEO y vista previa al compartir

Todo está en `src/index.html` y `public/`:

- `<title>` y `meta description` orientados a búsquedas locales (*galletas New York Girardot*, *a domicilio*).
- **Open Graph + Twitter Card** con `og-image.jpg` (1200×630, menos de 100 kB) para que el enlace se vea bien en WhatsApp, Instagram, Facebook e iMessage.
- **JSON-LD**: `Bakery` (teléfono, horario, zona de entrega, catálogo), `WebSite` y `FAQPage`.
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest` e iconos.
- Si cambias una pregunta frecuente en `app.ts`, actualiza también el bloque `FAQPage` de `index.html`.

### Pendientes fuera del código

- Crear el **Perfil de Negocio de Google** (Google Business Profile): es lo que más pesa para aparecer en búsquedas locales y en Maps.
- Registrar el sitio en **Google Search Console** y enviar `https://crunkycookies.com/sitemap.xml`.
- Después de publicar, refrescar la vista previa en el [depurador de Facebook](https://developers.facebook.com/tools/debug/) (WhatsApp guarda en caché la imagen anterior).
- Verificar que el Instagram del footer (`instagramUrl` en `app.ts`) sea el real.
- Reemplazar las imágenes de `public/galletas/` por fotos reales cuando existan (mismo nombre de archivo, fondo transparente).
- Las reseñas y las cifras del hero (+200 pedidos, 4.9★) están en `app.ts` y `app.html`: mantenlas con datos reales.

---

Hecho con 🤎 en Girardot.
