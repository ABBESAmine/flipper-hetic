/**
 * Runtime vue playfield — caméra, resize, application de viewConfig.
 *
 * Cadrage 9:16 : le rendu est letterboxé au ratio cible (cabinet portrait), et
 * la caméra orthographique est zoomée pour que le rectangle de jeu (frame*,
 * viewConfig) remplisse ce cadre. Le calcul projette les coins du rectangle en
 * NDC : il reste correct même si la caméra est inclinée (vue 3/4 top-down).
 */
import * as THREE from "three";
import { MAX_RENDERER_PIXEL_RATIO, MIN_RENDERER_PIXEL_RATIO } from "../domain/constants.js";
import {
  PLAYFIELD_VIEW_DEFAULTS,
  PLAYFIELD_TARGET_ASPECT,
  applyViewConfigToPerspectiveCamera,
} from "../domain/viewConfig.js";
import { applyPhysicsGravity } from "../adapters/physics/rapier/world.js";

const DEG = Math.PI / 180;

// Scratch réutilisés (évite des allocations à chaque resize).
const _viewInverse = new THREE.Matrix4();
const _corner = new THREE.Vector3();

/**
 * @param {object} deps
 * @param {import("three").PerspectiveCamera} deps.camera
 * @param {import("three").WebGLRenderer} deps.renderer
 * @param {import("three").Scene} [deps.scene]
 * @param {import("three").Group} [deps.levelGroup]
 * @param {object} [deps.world]
 * @param {import("three").DirectionalLight} [deps.dirLight]
 * @param {typeof PLAYFIELD_VIEW_DEFAULTS} [params]
 */
export function createPlayfieldViewRuntime(deps, params = PLAYFIELD_VIEW_DEFAULTS) {
  const { camera, renderer, scene, levelGroup, world, dirLight } = deps;

  let activeCamera = camera;
  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, params.near, params.far);

  function applyCameraTransform(target) {
    target.position.set(params.cameraPosX, params.cameraPosY, params.cameraPosZ);
    target.up.set(params.cameraUpX, params.cameraUpY, params.cameraUpZ).normalize();
    target.lookAt(params.lookAtX, params.lookAtY, params.lookAtZ);
    target.near = params.near;
    target.far = params.far;
  }

  /** Coins (monde) du rectangle de cadrage, plan Y = frameY, en repère levelGroup. */
  function frameCornersWorld() {
    const xs = [params.frameMinX, params.frameMaxX];
    const zs = [params.frameMinZ, params.frameMaxZ];
    const matrix = levelGroup ? levelGroup.matrixWorld : new THREE.Matrix4();
    const corners = [];
    for (const x of xs) {
      for (const z of zs) {
        corners.push(new THREE.Vector3(x, params.frameY, z).applyMatrix4(matrix));
      }
    }
    return corners;
  }

  /**
   * Règle les bornes ortho pour que le rectangle de cadrage remplisse le cadre
   * 9:16. La caméra doit déjà être positionnée (applyCameraTransform).
   *
   * Travaille en espace caméra (eye-space) : on mesure l'emprise du rectangle
   * puis on règle des bornes ortho centrées dessus. Le rectangle peut donc être
   * décentré par rapport à l'axe de visée — il sera quand même centré et rempli.
   */
  function fitOrthoToFrame() {
    const aspect = PLAYFIELD_TARGET_ASPECT;

    orthoCamera.updateMatrixWorld(true);
    _viewInverse.copy(orthoCamera.matrixWorld).invert();

    // Emprise du rectangle de cadrage en espace caméra (X = horizontal écran,
    // Y = vertical écran ; on ignore Z = profondeur).
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const c of frameCornersWorld()) {
      _corner.copy(c).applyMatrix4(_viewInverse);
      minX = Math.min(minX, _corner.x); maxX = Math.max(maxX, _corner.x);
      minY = Math.min(minY, _corner.y); maxY = Math.max(maxY, _corner.y);
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const halfX = (maxX - minX) / 2;
    const halfY = (maxY - minY) / 2;
    if (halfX < 1e-6 || halfY < 1e-6) return;

    // Demi-largeur ortho (ow) en gardant le ratio 9:16 (ow/oh = aspect).
    //   cover  → le rectangle couvre tout l'écran ; l'axe le plus large déborde
    //            (rogné). C'est le mode "remplit parfaitement".
    //   contain→ le rectangle entier est visible ; marges sur l'axe le plus étroit.
    let ow = params.frameFitMode === "contain"
      ? Math.max(halfX, halfY * aspect)
      : Math.min(halfX, halfY * aspect);
    ow /= params.frameMargin || 1;
    const oh = ow / aspect;

    orthoCamera.left = centerX - ow;
    orthoCamera.right = centerX + ow;
    orthoCamera.top = centerY + oh;
    orthoCamera.bottom = centerY - oh;
    orthoCamera.near = params.near;
    orthoCamera.far = params.far;
    orthoCamera.updateProjectionMatrix();
  }

  function apply() {
    if (params.cameraMode === "orthographic") {
      activeCamera = orthoCamera;
      applyCameraTransform(orthoCamera);
    } else {
      activeCamera = camera;
      applyViewConfigToPerspectiveCamera(camera, params);
    }

    if (levelGroup) {
      levelGroup.position.set(params.levelPosX, params.levelPosY, params.levelPosZ);
      levelGroup.rotation.set(
        params.levelRotX * DEG,
        params.levelRotY * DEG,
        params.levelRotZ * DEG,
      );
      levelGroup.updateMatrixWorld(true);
    }

    // Cadrage ortho calculé après la pose caméra + transform du levelGroup
    // (le rectangle est exprimé dans le repère du groupe).
    if (params.cameraMode === "orthographic") fitOrthoToFrame();

    if (world) applyPhysicsGravity(world, params.gravityTiltDeg, params.gravityMagnitude);

    if (dirLight) {
      dirLight.position.set(params.dirLightX, params.dirLightY, params.dirLightZ);
      dirLight.intensity = params.dirLightIntensity;
    }

    if (scene) {
      const ambient = scene.children.find((c) => c.isAmbientLight);
      if (ambient) ambient.intensity = params.ambientIntensity;
    }
  }

  /**
   * Letterbox au ratio 9:16 : on calcule le plus grand rectangle 9:16 tenant
   * dans la fenêtre et on centre le canvas. Sur le cabinet (déjà 9:16) le canvas
   * occupe toute la dalle ; en navigateur paysage on obtient des bandes noires
   * sans déformation.
   */
  function onResize() {
    const targetAspect = PLAYFIELD_TARGET_ASPECT;
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (width / height > targetAspect) {
      width = Math.round(height * targetAspect);
    } else {
      height = Math.round(width / targetAspect);
    }

    renderer.setPixelRatio(
      Math.min(
        Math.max(window.devicePixelRatio || 1, MIN_RENDERER_PIXEL_RATIO),
        MAX_RENDERER_PIXEL_RATIO,
      ),
    );
    renderer.setSize(width, height);

    const dom = renderer.domElement;
    dom.style.position = "absolute";
    dom.style.left = `${Math.round((window.innerWidth - width) / 2)}px`;
    dom.style.top = `${Math.round((window.innerHeight - height) / 2)}px`;

    if (params.cameraMode === "perspective") {
      camera.aspect = targetAspect;
      camera.updateProjectionMatrix();
    } else {
      fitOrthoToFrame();
    }
  }

  apply();
  onResize();

  return {
    params,
    getCamera: () => activeCamera,
    orthoCamera,
    apply,
    onResize,
  };
}
