import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Inclinación base de la galleta hacia la cámara (vista 3/4). */
export const BASE_TILT_X = 0.92;
export const BASE_TILT_Z = -0.12;

export function configureRenderer(renderer: WebGLRenderer): void {
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
}

/** Luces cálidas + entorno de estudio. Devuelve una función para liberar recursos. */
export function lightStage(scene: Scene, renderer: WebGLRenderer): () => void {
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const key = new DirectionalLight(0xfff0dc, 2.7);
  key.position.set(-2.6, 3.4, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.7;
  key.shadow.camera.right = 1.7;
  key.shadow.camera.top = 1.7;
  key.shadow.camera.bottom = -1.7;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 5;

  const rim = new DirectionalLight(0xffc7b4, 1.1);
  rim.position.set(3.2, 1.2, -2.4);

  const fill = new AmbientLight(0xfff4e6, 0.35);
  scene.add(key, rim, fill);

  return () => {
    env.dispose();
    key.shadow.map?.dispose();
  };
}

/** Cámara que encuadra la galleta (radio ~1) ocupando `fill` del lado menor. */
export function frameCamera(camera: PerspectiveCamera, aspect: number, fill = 0.62): void {
  camera.fov = 28;
  camera.aspect = aspect;
  const half = Math.tan((camera.fov * Math.PI) / 360);
  const fit = 1.08 / (fill * half);
  camera.position.set(0, 0, aspect >= 1 ? fit : fit / aspect);
  camera.near = 0.1;
  camera.far = 60;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}
