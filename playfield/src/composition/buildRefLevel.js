/**
 * Construit le niveau à partir du layout de référence (refLayout.js) :
 * colliders Rapier statiques + meshes néon, posés dans notre repère X-Z.
 * Réutilise nos acteurs (balle, flippers, gate) via buildActors.
 *
 * Retourne la même interface que l'ancien buildLevel pour rester compatible
 * avec main.js / runGameLoop (syncPairs = acteurs dynamiques uniquement ; les
 * éléments statiques sont des meshes posés une fois dans visualsGroup).
 */
import * as THREE from "three";
import { createStaticBoxBody, createCylinderBody, createSensorBoxBody } from "../adapters/physics/index.js";
import { buildActors } from "./buildActors.js";
import { BB, glowTexture } from "../adapters/renderer/playfieldVisuals.js";
import {
  WALLS, SLINGSHOTS, BUMPERS, BUMPER_RADIUS, POSTS, POST_RADIUS,
  GATE, SPECIAL_ZONES, mapPoint, SCALE,
} from "./refLayout.js";
import {
  FLIPPER_PIVOT_X, FLIPPER_OFFSET_X, FLIPPER_PIVOT_Z, FLIPPER_PIVOT_Y,
} from "../domain/constants.js";
import { loadGLBOrNull, instantiateGLB, instantiateFittedGLB, applyPropMaps } from "../adapters/renderer/glbLoader.js";
import { GLB_PROPS } from "./glbRegistry.js";

const WALL_HEIGHT = 1.0;
const WALL_THICK = 0.3;
const PROP_HEIGHT = 1.0;
const WALL_SIDE_TILE = 1.0; // longueur monde par répétition de la tôle (côtés)
const WALL_TOP_TILE = 2.2;  // longueur monde par répétition de la bande de vis (dessus)

function quatYaw(yaw) {
  const h = yaw / 2;
  return { x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) };
}

// Textures de mur chargées une fois (clonées par segment pour le tiling).
const _texLoader = new THREE.TextureLoader();
let _wallSideTex = null;
let _wallTopTex = null;
function wallBaseTextures() {
  if (!_wallSideTex) {
    _wallSideTex = _texLoader.load("/models/texture_wall_side.png");
    _wallTopTex = _texLoader.load("/models/texture_wall_top.png");
    for (const t of [_wallSideTex, _wallTopTex]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }
  }
  return { side: _wallSideTex, top: _wallTopTex };
}

/** Métal industriel émissif (slingshots/kickers) : base sombre + liseré coloré. */
function wallMaterial(intensity = 0.2, glow = BB.rust) {
  return new THREE.MeshStandardMaterial({
    color: 0x2e2418, emissive: glow, emissiveIntensity: intensity,
    roughness: 0.6, metalness: 0.3,
  });
}

/**
 * Matériaux texturés d'un mur métallique : tôle rouillée sur les côtés, bande de
 * têtes de vis sur le dessus. Tableau de 6 (faces BoxGeometry : +X,-X,+Y,-Y,+Z,-Z) :
 * index 2 = +Y = dessus. Textures clonées + répétées selon la longueur du mur.
 */
function wallMaterials(len, height) {
  const { side, top } = wallBaseTextures();

  const sideMap = side.clone();
  sideMap.repeat.set(Math.max(1, Math.round(len / WALL_SIDE_TILE)), Math.max(1, Math.round(height / WALL_SIDE_TILE)));
  sideMap.needsUpdate = true;

  const topMap = top.clone();
  topMap.repeat.set(Math.max(1, Math.round(len / WALL_TOP_TILE)), 1);
  topMap.needsUpdate = true;

  const sideMat = new THREE.MeshStandardMaterial({
    map: sideMap, emissiveMap: sideMap, emissive: 0xffffff, emissiveIntensity: 0.3,
    metalness: 0.5, roughness: 0.75,
  });
  const topMat = new THREE.MeshStandardMaterial({
    map: topMap, emissiveMap: topMap, emissive: 0xffffff, emissiveIntensity: 0.35,
    metalness: 0.5, roughness: 0.7,
  });
  return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
}

/** Crée un mur-segment (collider box rotée + mesh) entre A et B mappés. */
function addSegment(world, group, a, b, { type = "wall", intensity = 0.2, height = WALL_HEIGHT, glow = BB.rust } = {}) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz, dx); // aligne l'axe X local de la box sur le segment
  const mid = { x: (a.x + b.x) / 2, y: height / 2, z: (a.z + b.z) / 2 };

  createStaticBoxBody(world, {
    width: len, height, depth: WALL_THICK,
    position: mid,
    rotation: quatYaw(yaw),
    type,
  });

  // Murs = métal texturé (tôle + vis sur le dessus) ; slingshots = émissif hazmat.
  const material = type === "wall" ? wallMaterials(len, height) : wallMaterial(intensity, glow);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, height, WALL_THICK), material);
  mesh.position.set(mid.x, mid.y, mid.z);
  mesh.rotation.y = yaw;
  group.add(mesh);
}

/** Bumper : collider cylindre + (GLB ou anneau+cap procéduraux) + halo. */
function addBumper(world, group, glowTex, center, radius, glbOriginal) {
  createCylinderBody(world, {
    radius, height: PROP_HEIGHT, x: center.x, y: PROP_HEIGHT / 2, z: center.z, type: "bumper",
  });

  if (glbOriginal) {
    const cfg = GLB_PROPS.bumper;
    group.add(instantiateFittedGLB(glbOriginal, {
      x: center.x, z: center.z, fitDiameter: cfg.fitDiameter, rotYDeg: cfg.rotYDeg, yOffset: cfg.yOffset,
    }));
  } else {
    // Fallback procédural = baril chimique : fût rouille + couvercle vert toxique.
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, PROP_HEIGHT, 30),
      new THREE.MeshStandardMaterial({
        color: BB.rust, emissive: BB.rust, emissiveIntensity: 0.5,
        roughness: 0.55, metalness: 0.4,
      }),
    );
    ring.position.set(center.x, PROP_HEIGHT / 2, center.z);
    group.add(ring);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, PROP_HEIGHT * 1.25, 24),
      new THREE.MeshStandardMaterial({
        color: BB.acid, emissive: BB.acid, emissiveIntensity: 1.2, roughness: 0.35,
      }),
    );
    cap.position.set(center.x, PROP_HEIGHT * 0.65, center.z);
    group.add(cap);
  }

  // Halo additif conservé dans les deux cas.
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: BB.acid, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0.45,
  }));
  glow.position.set(center.x, PROP_HEIGHT, center.z);
  glow.scale.set(radius * 4, radius * 4, 1);
  group.add(glow);
}

/** Gate one-way du couloir : mesh semi-transparent, sans collider (v1 ouvert). */
function addGate(group, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz, dx);
  const h = WALL_HEIGHT * 0.5;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(len, h, WALL_THICK),
    new THREE.MeshStandardMaterial({
      color: BB.meth, emissive: BB.meth, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.35,
    }),
  );
  mesh.position.set((a.x + b.x) / 2, h / 2, (a.z + b.z) / 2);
  mesh.rotation.y = yaw;
  group.add(mesh);
}

/** Knob cylindrique au pivot d'un flipper (visuel, statique). */
function addKnob(group, x) {
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.5, 18),
    new THREE.MeshStandardMaterial({
      color: BB.hazmat, emissive: BB.hazmat, emissiveIntensity: 0.8,
      roughness: 0.4, metalness: 0.3,
    }),
  );
  knob.position.set(x, FLIPPER_PIVOT_Y, FLIPPER_PIVOT_Z);
  group.add(knob);
}

/** Post guide : collider cylindre + (GLB ou cylindre procédural). */
function addPost(world, group, center, radius, glbOriginal) {
  createCylinderBody(world, {
    radius, height: PROP_HEIGHT, x: center.x, y: PROP_HEIGHT / 2, z: center.z, type: "wall",
  });
  if (glbOriginal) {
    const cfg = GLB_PROPS.post;
    group.add(instantiateFittedGLB(glbOriginal, {
      x: center.x, z: center.z, fitDiameter: cfg.fitDiameter, rotYDeg: cfg.rotYDeg, yOffset: cfg.yOffset,
    }));
    return;
  }
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, PROP_HEIGHT, 16),
    new THREE.MeshStandardMaterial({
      color: BB.hazmat, emissive: BB.hazmat, emissiveIntensity: 0.9, roughness: 0.4,
    }),
  );
  post.position.set(center.x, PROP_HEIGHT / 2, center.z);
  group.add(post);
}

/** Texte court sur fond transparent (label de zone, lisible en billboard). */
function labelTexture(text) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 256, 128);
  g.fillStyle = "#ffffff";
  g.font = "bold 80px 'Arial Black', Impact, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Zone spéciale (Tuco / RV) : capteur qui émet `type` au passage de la bille
 * (déclenche le score + la vidéo backglass déjà câblés) + visuel marquant
 * (disque encastré, anneau lumineux, halo, label en billboard).
 */
function addSpecialZone(world, group, glowTex, { center, radius, color, label, type }) {
  createSensorBoxBody(world, {
    width: radius * 2, height: 1.0, depth: radius * 2,
    position: { x: center.x, y: 0.5, z: center.z },
    type,
  });

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.06, 32),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85, metalness: 0.2 }),
  );
  disc.position.set(center.x, 0.04, center.z);
  group.add(disc);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, radius * 0.12, 12, 36),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.3 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(center.x, 0.14, center.z);
  group.add(ring);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0.7,
  }));
  glow.position.set(center.x, 0.35, center.z);
  glow.scale.set(radius * 5, radius * 5, 1);
  group.add(glow);

  const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTexture(label), transparent: true, depthWrite: false, depthTest: false,
  }));
  labelSprite.position.set(center.x, 0.9, center.z);
  labelSprite.scale.set(radius * 2.6, radius * 1.3, 1);
  group.add(labelSprite);

  return { ring, glow };
}

export async function buildRefLevel({ scene, world }) {
  const visualsGroup = new THREE.Group();
  visualsGroup.name = "ref-playfield-visuals";
  const glowTex = glowTexture();

  // GLB des props (null si absent → fallback procédural).
  const glb = {
    bumper: await loadGLBOrNull(GLB_PROPS.bumper.url),
    post: await loadGLBOrNull(GLB_PROPS.post.url),
    flipper: await loadGLBOrNull(GLB_PROPS.flipper.url),
  };
  // Textures externes appliquées une fois sur l'original (clones partagés).
  if (glb.bumper) applyPropMaps(glb.bumper, GLB_PROPS.bumper.maps);

  for (const [a, b] of WALLS) {
    addSegment(world, visualsGroup, mapPoint(a), mapPoint(b), { type: "wall" });
  }
  for (const [a, b] of SLINGSHOTS) {
    addSegment(world, visualsGroup, mapPoint(a), mapPoint(b), { type: "slingshot", intensity: 1.0, height: WALL_HEIGHT + 0.1, glow: BB.hazmat });
  }
  for (const c of BUMPERS) {
    addBumper(world, visualsGroup, glowTex, mapPoint(c), BUMPER_RADIUS * SCALE, glb.bumper);
  }
  for (const p of POSTS) {
    addPost(world, visualsGroup, mapPoint(p), POST_RADIUS * SCALE, glb.post);
  }
  addGate(visualsGroup, mapPoint(GATE[0]), mapPoint(GATE[1]));

  // Zones spéciales (Tuco +1000, RV +5000) — capteurs + visuels marquants.
  for (const z of SPECIAL_ZONES) {
    addSpecialZone(world, visualsGroup, glowTex, {
      center: mapPoint(z), radius: z.radius * SCALE,
      color: BB[z.color], label: z.label, type: z.type,
    });
  }

  // Knobs procéduraux au pivot — seulement si le flipper reste procédural.
  if (!glb.flipper) {
    addKnob(visualsGroup, -FLIPPER_PIVOT_X + FLIPPER_OFFSET_X);
    addKnob(visualsGroup,  FLIPPER_PIVOT_X + FLIPPER_OFFSET_X);
  }

  // Acteurs dynamiques (balle, flippers, gate) — positions via constants mappées.
  const { ballBody, flipperBodies, launchGateBody, syncPairs } = buildActors(world, scene);

  // Swap GLB des flippers : un seul modèle, la droite = la gauche tournée de 180°.
  // Le GLB est enfant du Group synchronisé, posé au pivot ; on masque la batte.
  if (glb.flipper) {
    const cfg = GLB_PROPS.flipper;
    // Faces visibles des deux côtés (le miroir inverse le sens des faces).
    glb.flipper.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) m.side = THREE.DoubleSide;
    });
    for (const { mesh, body } of syncPairs) {
      if (body?.userData?.type !== "flipper") continue;
      const isLeft = mesh.name === "flipper-left";
      mesh.add(instantiateGLB(glb.flipper, {
        x: cfg.xOffset, y: cfg.yOffset, z: cfg.zOffset,
        fitLength: cfg.fitLength,
        rotYDeg: cfg.rotYDeg,
        mirror: !isLeft, // miroir X : droit = miroir du gauche (sens vertical OK)
        mirrorZ: true,   // miroir Z : remet les deux battes dans le bon sens horizontal
      }));
      const bat = mesh.getObjectByName("flipper-bat");
      if (bat) bat.visible = false;
    }
  }

  return {
    syncPairs,
    ballBody,
    flipperBodies,
    launchGateBody,
    visualsGroup,
    // Compat ancienne interface (debug / main.js) :
    gltfModel: new THREE.Group(),
    physicsRotateY: () => {},
    setPhysicsDebugVisible: () => {},
  };
}
