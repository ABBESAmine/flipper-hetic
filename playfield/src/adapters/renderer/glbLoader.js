/**
 * Chargement de props GLB : cache, fallback, application de textures externes,
 * et auto-fit (mise à l'échelle + pose au sol depuis la bounding box).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const gltfLoader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const cache = new Map(); // url → Promise<THREE.Object3D>

// Anisotropie : nette la texture vue en biais (caméra inclinée). Valeur haute,
// clampée au max GPU à l'upload.
const ANISOTROPY = 16;

function loadOnce(url) {
  if (!cache.has(url)) {
    cache.set(url, new Promise((resolve, reject) => {
      gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
    }));
  }
  return cache.get(url);
}

/** Charge la scène GLB d'origine, ou null si absente/illisible (fallback). */
export async function loadGLBOrNull(url) {
  if (!url) return null;
  try {
    return await loadOnce(url);
  } catch {
    console.warn(`[glb] ${url} introuvable → mesh procédural`);
    return null;
  }
}

// Convention glTF : UV origine en haut-gauche → flipY=false ; données non-couleur
// (normal/roughness/alpha) en espace linéaire. `flipY` ajustable car les PNG
// externes n'ont pas toujours la même orientation que les UV du modèle.
function loadDataTexture(url, flipY = false) {
  const t = texLoader.load(url);
  t.flipY = flipY;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = ANISOTROPY;
  return t;
}

// Texture de couleur (albédo / base color) : espace sRGB. Mipmaps trilinéaires +
// anisotropie maximale → surface STABLE (pas de fourmillement). La netteté finale
// vient du supersampling du renderer (pixel ratio), pas du filtre de texture :
// sur un prop minifié, sans mipmaps ça fourmille, avec ça reste propre.
function loadColorTexture(url, flipY = false) {
  const t = texLoader.load(url);
  t.flipY = flipY;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = ANISOTROPY;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}

/** Charge une texture et inverse ses canaux (smoothness → roughness). */
function loadInvertedTexture(url, flipY = false) {
  const tex = new THREE.Texture();
  tex.flipY = flipY;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = ANISOTROPY;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(data, 0, 0);
    tex.image = c;
    tex.needsUpdate = true;
  };
  img.onerror = () => console.warn(`[glb] texture introuvable: ${url}`);
  img.src = url;
  return tex;
}

/**
 * Applique des maps externes aux matériaux du GLB (une seule fois sur
 * l'original ; les clones partagent les matériaux).
 *   maps = { normalMap, roughnessFromSmoothness, alphaMap }
 */
export function applyPropMaps(object3d, maps) {
  if (!object3d || !maps) return;
  const f = !!maps.flipY; // toutes les maps partagent les mêmes UV
  const colorMap = maps.colorMap ? loadColorTexture(maps.colorMap, f) : null;
  const normalMap = maps.normalMap ? loadDataTexture(maps.normalMap, f) : null;
  const roughnessMap = maps.roughnessFromSmoothness
    ? loadInvertedTexture(maps.roughnessFromSmoothness, f)
    : (maps.roughnessMap ? loadDataTexture(maps.roughnessMap, f) : null);
  const alphaMap = maps.alphaMap ? loadDataTexture(maps.alphaMap, f) : null;

  object3d.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m.isMeshStandardMaterial) continue;
      if (colorMap) {
        // Prop peint : on montre l'albédo (blanc neutre + dielectrique).
        m.map = colorMap;
        m.color.set(0xffffff);
        m.metalness = 0;
      }
      if (normalMap) m.normalMap = normalMap;
      if (roughnessMap) { m.roughnessMap = roughnessMap; m.roughness = 1; }
      if (alphaMap) { m.alphaMap = alphaMap; m.transparent = true; m.alphaTest = 0.5; }
      m.needsUpdate = true;
    }
  });
}

/**
 * Clone + transform simple (pour les flippers : pas de recentrage, le pivot
 * reste à l'origine du modèle). `fitLength` met la plus grande dimension du
 * modèle à cette longueur (auto-échelle, indépendant de l'orientation).
 */
export function instantiateGLB(original, { x = 0, y = 0, z = 0, scale = 1, rotYDeg = 0, fitLength = null, mirror = false, mirrorZ = false } = {}) {
  const obj = original.clone(true);
  if (fitLength) {
    obj.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    obj.scale.setScalar(fitLength / (Math.max(size.x, size.y, size.z) || 1));
  } else if (typeof scale === "number") {
    obj.scale.setScalar(scale);
  } else {
    obj.scale.set(scale.x, scale.y, scale.z);
  }
  if (mirror) obj.scale.x *= -1;  // symétrie sur X (flipper droit = miroir du gauche)
  if (mirrorZ) obj.scale.z *= -1; // symétrie sur Z (retourne la batte horizontalement)
  obj.rotation.y = (rotYDeg * Math.PI) / 180;
  obj.position.set(x, y, z);
  return obj;
}

/**
 * Clone, auto-dimensionne le prop à `fitDiameter` (plus grande dimension
 * horizontale) et le pose au sol, centré sur (x, z). Idéal pour les props
 * statiques quelle que soit l'échelle/origine du GLB source.
 */
export function instantiateFittedGLB(original, { x = 0, z = 0, fitDiameter = 1, rotYDeg = 0, yOffset = 0 } = {}) {
  const obj = original.clone(true);
  obj.rotation.y = (rotYDeg * Math.PI) / 180;

  obj.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  const horiz = Math.max(size.x, size.z) || 1;
  obj.scale.multiplyScalar(fitDiameter / horiz);

  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.set(x - center.x, yOffset - box.min.y, z - center.z);
  return obj;
}
