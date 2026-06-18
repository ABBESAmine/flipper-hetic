/**
 * Playfield — Scene Three.js, camera, lumieres, renderer.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  MAX_RENDERER_PIXEL_RATIO,
  MIN_RENDERER_PIXEL_RATIO,
  RENDERER_ANTIALIAS,
} from "../../domain/constants.js";
import {
  PLAYFIELD_VIEW_DEFAULTS,
  applyViewConfigToPerspectiveCamera,
} from "../../domain/viewConfig.js";

function effectivePixelRatio() {
  // Suréchantillonnage : au moins MIN (même sur écran dpr=1), plafonné à MAX.
  return Math.min(
    Math.max(window.devicePixelRatio || 1, MIN_RENDERER_PIXEL_RATIO),
    MAX_RENDERER_PIXEL_RATIO,
  );
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x140d08); // nuit désert (Breaking Bad)

  // Camera (config figée dans domain/viewConfig.js)
  const camera = new THREE.PerspectiveCamera(
    PLAYFIELD_VIEW_DEFAULTS.fov,
    window.innerWidth / window.innerHeight,
    PLAYFIELD_VIEW_DEFAULTS.near,
    PLAYFIELD_VIEW_DEFAULTS.far,
  );
  applyViewConfigToPerspectiveCamera(camera);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: RENDERER_ANTIALIAS,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(effectivePixelRatio());
  // Ombres portées (profondeur/relief) : map douce, projetées par la dir. light.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#000"; // bandes de letterbox 9:16
  document.body.appendChild(renderer.domElement);

  // Environment map (éclairage image-based) : indispensable pour que les
  // matériaux PBR métalliques des GLB ne rendent pas noir (un métal sans
  // réflexion = noir). N'affecte pas le rendu émissif néon.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Lumieres
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    PLAYFIELD_VIEW_DEFAULTS.ambientIntensity,
  );
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(
    0xffffff,
    PLAYFIELD_VIEW_DEFAULTS.dirLightIntensity,
  );
  dirLight.position.set(
    PLAYFIELD_VIEW_DEFAULTS.dirLightX,
    PLAYFIELD_VIEW_DEFAULTS.dirLightY,
    PLAYFIELD_VIEW_DEFAULTS.dirLightZ,
  );
  // Projection d'ombres : frustum ortho couvrant tout le plateau (X ≈ ±6,
  // Z ≈ ±10), biais anti-acné, carte 2048 pour des bords nets.
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.left = -8;
  dirLight.shadow.camera.right = 8;
  dirLight.shadow.camera.top = 12;
  dirLight.shadow.camera.bottom = -12;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 60;
  dirLight.shadow.bias = -0.0004;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);
  scene.add(dirLight.target); // cible (0,0,0) par défaut

  return { scene, camera, renderer, ambientLight, dirLight };
}
