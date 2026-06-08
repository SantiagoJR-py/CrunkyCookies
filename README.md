# Crunky Cookies — Web oficial

Sitio one-page para **Crunky Cookies**, galletas estilo New York hechas a mano en Girardot (Cundinamarca).
La página está pensada como un embudo lineal: el visitante llega → se antoja → hace el pedido por WhatsApp.

## Stack

- **Angular 20** (standalone components + signals + control flow `@if/@for/@switch`)
- **CSS puro** con variables para la paleta de marca (sin frameworks)
- **Google Fonts**: Playfair Display (serif para títulos) + Inter (sans para cuerpo)
- **Ilustraciones SVG inline** dibujadas a mano para cada sabor (sin dependencia de fotos externas)

## Paleta oficial

| Color | Hex | Uso |
| --- | --- | --- |
| Crema | `#F5ECD7` | Fondos principales |
| Chocolate | `#4A2C17` | Texto y CTAs |
| Rosa polvoso | `#E8C4B8` | Secciones alternas |
| Rosa claro | `#F2D5C0` | Acentos suaves |
| Dorado | `#C9A47A` | Detalles |

Definidos como variables CSS en `src/styles.css` (`--crema`, `--chocolate`, `--rosa`, `--dorado`).

## Estructura de la página

1. **Header** sticky con logo y navegación (menú hamburguesa en móvil).
2. **Hero** — gradiente crema/rosa con galleta partida animada y CTA grande “Haz tu pedido”.
3. **¿Qué es Crunky?** — tres líneas con la propuesta de valor.
4. **Nuestras galletas** — 6 tarjetas + tarjeta especial “Personaliza la tuya” que lleva al formulario.
5. **¿Cómo pedir?** — 3 pasos visuales (Elige sabor → Escríbenos → Recibe en tu puerta).
6. **Reseñas** — 3 testimonios con estrellas y barrios (prueba social).
7. **Pedido / Contacto** — formulario que arma el mensaje y abre **WhatsApp directo a +57 324 330 0085** con el pedido pre-armado.
8. **Footer** + **botón flotante de WhatsApp** visible en toda la página.

## Cómo funciona el flujo de pedido

- Cada tarjeta de sabor tiene un botón `+` que suma al pedido.
- Aparece un resumen flotante con el conteo y un botón “Continuar pedido”.
- Al enviar el formulario, se construye un mensaje formateado y se abre `https://wa.me/573243300085?text=...`.
- El botón flotante y el botón “Pedir directo por WhatsApp” abren un mensaje genérico para clientes que no quieren llenar el formulario.

## SEO local Girardot

Implementado en `src/index.html`:
- `<title>` y `meta description` con keywords *galletas New York Girardot*, *galletas artesanales Girardot*, *galletas personalizadas Girardot*.
- Open Graph + Twitter Cards para que los enlaces compartidos en Instagram y WhatsApp se vean bonitos.
- `JSON-LD` con `@type: Bakery` para Google Rich Results y futura integración con Google My Business.
- `lang="es-CO"`, `geo.region=CO-CUN` y geolocalización en Girardot, Cundinamarca.

## Comandos

```bash
npm install        # Instala dependencias
npm start          # Servidor de desarrollo en http://localhost:4200
npm run build      # Build de producción a dist/crunky_cookies
npm test           # Tests unitarios con Karma
```

## Diseño responsive

Mobile-first. Breakpoints en `src/app/app.css`:
- `≤ 960px` — colapsa hero a 1 columna, navegación a hamburguesa, formulario debajo.
- `≤ 640px` — galletas en 1 columna, paddings reducidos, CTA full-width.
- `≤ 420px` — ajustes finos de tipografía.

## Cosas que aún puedes pulir tú

- **Reemplazar las ilustraciones SVG** por fotos reales de tus galletas cuando tengas la sesión de fotos lista (van en `<ng-template #cookieIllustration>` en `src/app/app.html`, o reemplaza la ilustración por `<img src="/fotos/tu-foto.jpg">`).
- **Conectar Instagram** real cambiando el link en el footer (`https://instagram.com/crunky.cookies`).
- **Crear el perfil de Google My Business** con la dirección física para aparecer en el mapa.
- **Sumar precios** SOLO cuando tengas costos confirmados (intencionalmente no incluí precios para no comprometerte con números equivocados).

---

Hecho con 🤎 en Girardot.
