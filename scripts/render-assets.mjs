#!/usr/bin/env node
/**
 * Genera las imágenes del sitio con Chrome en modo headless:
 *   - public/galletas/*.webp   → cada sabor, con la misma escena Three.js del sitio
 *   - public/icons/*.png       → iconos de la app a partir del logo SVG
 *   - public/og-image.jpg      → imagen 1200x630 para compartir (WhatsApp, redes)
 *
 *   npm run assets
 *
 * Requiere Google Chrome o Chromium instalado (variable CHROME para otra ruta).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const work = mkdtempSync(join(tmpdir(), 'crunky-studio-'));
const chrome = process.env.CHROME || 'google-chrome';

await build({
  entryPoints: [join(root, 'scripts/studio.ts')],
  bundle: true,
  format: 'iife',
  outfile: join(work, 'studio.js'),
  logLevel: 'error',
});
writeFileSync(join(work, 'studio.html'), '<!doctype html><meta charset="utf-8"><body><script src="studio.js"></script>');

const FLAGS = [
  '--headless=new',
  '--no-sandbox',
  '--hide-scrollbars',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--allow-file-access-from-files',
  '--virtual-time-budget=20000',
];

function runChrome(args) {
  return execFileSync(chrome, [...FLAGS, ...args], {
    maxBuffer: 256 * 1024 * 1024,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/** Abre una página que deja un JSON de data-URLs en <pre id="out"> y lo devuelve. */
function harvest(htmlFile) {
  const dom = runChrome(['--dump-dom', `file://${htmlFile}`]);
  const match = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!match) throw new Error(`Sin resultado en ${htmlFile}`);
  const data = JSON.parse(match[1].replace(/&amp;/g, '&'));
  if (data.error) throw new Error(data.error);
  return data;
}

function save(file, dataUrl) {
  mkdirSync(dirname(file), { recursive: true });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(file, buf);
  console.log(`✓ ${file.replace(root + '/', '')} (${Math.round(buf.length / 1024)} kB)`);
}

/* ---------- 1. Galletas ---------- */
const cookies = harvest(join(work, 'studio.html'));
for (const [id, dataUrl] of Object.entries(cookies)) save(join(root, `public/galletas/${id}.webp`), dataUrl);

/* ---------- 2. Iconos ---------- */
const logo = `file://${join(root, 'public/svg/crunky_logo_v6.svg')}`;
writeFileSync(
  join(work, 'icons.html'),
  `<!doctype html><meta charset="utf-8"><body><script>
  const img = new Image();
  img.onload = () => {
    const out = {};
    const draw = (size, scale, bg) => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const ctx = c.getContext('2d');
      if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }
      const s = size * scale; ctx.drawImage(img, (size - s) / 2, (size - s) / 2, s, s);
      return c.toDataURL('image/png');
    };
    out['icon-192'] = draw(192, 1.08);
    out['icon-512'] = draw(512, 1.08);
    out['icon-maskable-512'] = draw(512, 0.86, '#F2D5C0');
    out['apple-touch-icon'] = draw(180, 0.98, '#F2D5C0');
    const pre = document.createElement('pre'); pre.id = 'out';
    pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  };
  img.src = ${JSON.stringify(logo)};
  </script>`,
);
const icons = harvest(join(work, 'icons.html'));
for (const [name, dataUrl] of Object.entries(icons)) save(join(root, `public/icons/${name}.png`), dataUrl);

/* ---------- 3. Imagen para compartir (Open Graph) ---------- */
const pic = (id) => `file://${join(root, `public/galletas/${id}.webp`)}`;
writeFileSync(
  join(work, 'og.html'),
  `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,500..700&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,600..700,100,0;1,9..144,500,100,1&display=block" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; }
    html, body { width: 1200px; height: 630px; overflow: hidden; }
    body { position: relative; font-family: 'DM Sans', sans-serif; color: #2a160b;
      background:
        radial-gradient(520px 520px at 880px 300px, #e8c4b8, transparent 70%),
        radial-gradient(420px 380px at 60px 640px, rgba(201,164,122,.45), transparent 70%),
        linear-gradient(180deg, #fcf8ee, #f7efdd); }
    .copy { position: absolute; left: 72px; top: 62px; width: 640px; }
    .brand { display: flex; align-items: center; gap: 16px; font: 700 34px 'Fraunces', serif; letter-spacing: -.02em; }
    .brand img { width: 72px; height: 72px; border-radius: 50%; }
    .brand em { font-weight: 500; color: #a9772f; font-variation-settings: 'SOFT' 100, 'WONK' 1; }
    h1 { margin-top: 44px; font: 600 86px/0.96 'Fraunces', serif; letter-spacing: -.035em; font-variation-settings: 'SOFT' 80; }
    h1 em { font-weight: 500; color: #a9772f; font-variation-settings: 'SOFT' 100, 'WONK' 1; }
    p { margin-top: 26px; font-size: 30px; font-weight: 500; color: #7a5236; }
    .cta { position: absolute; left: 72px; bottom: 60px; display: flex; align-items: center; gap: 22px; }
    .pill { display: inline-flex; align-items: center; gap: 12px; padding: 18px 30px; border-radius: 999px;
      background: #25d366; color: #05301a; font-size: 30px; font-weight: 700; box-shadow: 0 14px 34px rgba(37,211,102,.4); }
    .pill svg { width: 34px; height: 34px; }
    .url { font-size: 26px; font-weight: 700; color: #4a2c17; }
    .cookie { position: absolute; filter: drop-shadow(0 26px 26px rgba(42,22,11,.3)); }
    .c1 { width: 520px; right: 20px; top: 70px; }
    .c2 { width: 230px; right: 262px; top: 452px; transform: rotate(-18deg); }
    .c3 { width: 230px; right: -50px; top: 400px; transform: rotate(24deg); }
    .c4 { width: 190px; right: 330px; top: -50px; transform: rotate(30deg); }
  </style></head><body>
    <img class="cookie c4" src="${pic('oreo')}">
    <img class="cookie c1" src="${pic('chocochip')}">
    <img class="cookie c2" src="${pic('redvelvet')}">
    <img class="cookie c3" src="${pic('doblechoco')}">
    <div class="copy">
      <div class="brand"><img src="${logo}"><span>Crunky <em>Cookies</em></span></div>
      <h1>Galletas estilo <em>New York</em> en Girardot</h1>
      <p>Suaves por dentro · Crujientes por fuera</p>
    </div>
    <div class="cta">
      <span class="pill"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2z"/></svg>Pide por WhatsApp</span>
      <span class="url">crunkycookies.com</span>
    </div>
  </body></html>`,
);
const ogPng = join(work, 'og.png');
runChrome([`--screenshot=${ogPng}`, '--window-size=1200,630', '--force-device-scale-factor=1', `file://${join(work, 'og.html')}`]);
writeFileSync(
  join(work, 'og-jpg.html'),
  `<!doctype html><meta charset="utf-8"><body><script>
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
    c.getContext('2d').drawImage(img, 0, 0, 1200, 630);
    const pre = document.createElement('pre'); pre.id = 'out';
    pre.textContent = JSON.stringify({ og: c.toDataURL('image/jpeg', 0.86) }); document.body.appendChild(pre);
  };
  img.src = ${JSON.stringify('file://' + ogPng)};
  </script>`,
);
save(join(root, 'public/og-image.jpg'), harvest(join(work, 'og-jpg.html')).og);
