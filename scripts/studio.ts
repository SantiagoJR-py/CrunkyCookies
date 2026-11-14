/**
 * Estudio de render: dibuja cada sabor con la misma escena 3D del sitio
 * y deja los PNG/WebP en el DOM para que render-assets.mjs los extraiga.
 */
import { Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { buildCookie } from '../src/app/three/cookie-factory';
import { BASE_TILT_X, BASE_TILT_Z, configureRenderer, frameCamera, lightStage } from '../src/app/three/stage';
import { FLAVORS } from '../src/app/flavors';

const SIZE = 880;
const out: Record<string, string> = {};

try {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  configureRenderer(renderer);

  const scene = new Scene();
  lightStage(scene, renderer);
  const camera = new PerspectiveCamera();
  frameCamera(camera, 1, 0.86);

  FLAVORS.forEach((flavor, i) => {
    const cookie = buildCookie(flavor.id, 64);
    const tilt = new Group();
    tilt.rotation.set(BASE_TILT_X, 0, BASE_TILT_Z);
    cookie.group.rotation.y = 0.6 + i * 1.1;
    tilt.add(cookie.group);
    scene.add(tilt);
    renderer.render(scene, camera);
    out[flavor.id] = canvas.toDataURL('image/webp', 0.9);
    scene.remove(tilt);
    cookie.dispose();
  });
} catch (err) {
  out['error'] = String(err);
}

const pre = document.createElement('pre');
pre.id = 'out';
pre.textContent = JSON.stringify(out);
document.body.appendChild(pre);
