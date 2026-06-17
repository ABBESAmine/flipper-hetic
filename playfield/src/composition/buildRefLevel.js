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
import { createStaticBoxBody, createCylinderBody } from "../adapters/physics/index.js";
import { buildActors } from "./buildActors.js";
import { NEON, glowTexture } from "../adapters/renderer/playfieldVisuals.js";
import {
  WALLS, SLINGSHOTS, BUMPERS, BUMPER_RADIUS, POSTS, POST_RADIUS,
  GATE, CHASE, TARGETS, TARGET_HALF, mapPoint, SCALE,
} from "./refLayout.js";
import {
  FLIPPER_PIVOT_X, FLIPPER_OFFSET_X, FLIPPER_PIVOT_Z, FLIPPER_PIVOT_Y,
} from "../domain/constants.js";
import { loadGLBOrNull, instantiateGLB, instantiateFittedGLB, applyPropMaps } from "../adapters/renderer/glbLoader.js";
import { GLB_PROPS } from "./glbRegistry.js";

const WALL_HEIGHT = 1.0;
const WALL_THICK = 0.3;
const PROP_HEIGHT = 1.0;

function quatYaw(yaw) {
  const h = yaw / 2;
  return { x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) };
}

function neonWallMaterial(intensity = 0.75) {
  return new THREE.MeshStandardMaterial({
    color: NEON.green, emissive: NEON.green, emissiveIntensity: intensity,
    roughness: 0.4, metalness: 0.1,
  });
}

/** Crée un mur-segment (collider box rotée + mesh émissif) entre A et B mappés. */
function addSegment(world, group, a, b, { type = "wall", intensity = 0.75, height = WALL_HEIGHT } = {}) {
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

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(len, height, WALL_THICK),
    neonWallMaterial(intensity),
  );
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
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, PROP_HEIGHT, 30),
      new THREE.MeshStandardMaterial({
        color: NEON.green, emissive: NEON.green, emissiveIntensity: 1.0,
        roughness: 0.35, metalness: 0.3,
      }),
    );
    ring.position.set(center.x, PROP_HEIGHT / 2, center.z);
    group.add(ring);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, PROP_HEIGHT * 1.25, 24),
      new THREE.MeshStandardMaterial({
        color: NEON.bright, emissive: NEON.bright, emissiveIntensity: 1.6, roughness: 0.3,
      }),
    );
    cap.position.set(center.x, PROP_HEIGHT * 0.65, center.z);
    group.add(cap);
  }

  // Halo additif conservé dans les deux cas.
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: NEON.green, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0.5,
  }));
  glow.position.set(center.x, PROP_HEIGHT, center.z);
  glow.scale.set(radius * 4, radius * 4, 1);
  group.add(glow);
}

/** Texture d'une lettre (cible HETIC), façon référence. */
function letterTexture(letter) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#03130a";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#c6ffc6";
  g.font = "bold 96px monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(letter, 64, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
      color: NEON.bright, emissive: NEON.bright, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.4,
    }),
  );
  mesh.position.set((a.x + b.x) / 2, h / 2, (a.z + b.z) / 2);
  mesh.rotation.y = yaw;
  group.add(mesh);
}

/** Banque de cibles HETIC : collider box + mesh lettré. */
function addTarget(world, group, center, letter) {
  const w = TARGET_HALF * 2 * SCALE; // largeur
  const d = 1.6 * SCALE;             // profondeur (1.6 réf)
  const h = 3.4 * SCALE;             // hauteur (3.4 réf)
  createStaticBoxBody(world, {
    width: w, height: h, depth: d,
    position: { x: center.x, y: h / 2, z: center.z },
    type: "wall",
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: 0x0a2814, emissive: NEON.green, emissiveIntensity: 0.25,
      roughness: 0.5, map: letterTexture(letter),
    }),
  );
  mesh.position.set(center.x, h / 2, center.z);
  group.add(mesh);
}

/** Knob cylindrique au pivot d'un flipper (visuel, statique). */
function addKnob(group, x) {
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.5, 18),
    new THREE.MeshStandardMaterial({
      color: NEON.green, emissive: NEON.green, emissiveIntensity: 1.0,
      roughness: 0.3, metalness: 0.35,
    }),
  );
  knob.position.set(x, FLIPPER_PIVOT_Y, FLIPPER_PIVOT_Z);
  group.add(knob);
}

/** Point de chase light (sphère émissive, statique). */
function addChaseDot(group, p) {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.9 * SCALE, 12, 10),
    new THREE.MeshStandardMaterial({ color: NEON.green, emissive: NEON.green, emissiveIntensity: 0.6 }),
  );
  dot.position.set(p.x, 0.9 * SCALE, p.z);
  group.add(dot);
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
      color: NEON.bright, emissive: NEON.bright, emissiveIntensity: 1.3, roughness: 0.3,
    }),
  );
  post.position.set(center.x, PROP_HEIGHT / 2, center.z);
  group.add(post);
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
    addSegment(world, visualsGroup, mapPoint(a), mapPoint(b), { type: "wall", intensity: 0.7 });
  }
  for (const [a, b] of SLINGSHOTS) {
    addSegment(world, visualsGroup, mapPoint(a), mapPoint(b), { type: "slingshot", intensity: 1.4, height: WALL_HEIGHT + 0.1 });
  }
  for (const c of BUMPERS) {
    addBumper(world, visualsGroup, glowTex, mapPoint(c), BUMPER_RADIUS * SCALE, glb.bumper);
  }
  for (const p of POSTS) {
    addPost(world, visualsGroup, mapPoint(p), POST_RADIUS * SCALE, glb.post);
  }
  for (const t of TARGETS) {
    addTarget(world, visualsGroup, mapPoint(t), t.ch);
  }
  for (const p of CHASE) {
    addChaseDot(visualsGroup, mapPoint(p));
  }
  addGate(visualsGroup, mapPoint(GATE[0]), mapPoint(GATE[1]));

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
        mirror: !isLeft, // droit = miroir du gauche
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
