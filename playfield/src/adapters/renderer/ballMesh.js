/**
 * Playfield — Mesh Three.js de la bille.
 */
import * as THREE from "three";
import { BALL_RADIUS } from "../../domain/constants.js";
import { NEON, glowTexture } from "./playfieldVisuals.js";

export function createBallMesh(scene) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xe6ffe9,
      emissive: 0x5dd86a,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.12,
    }),
  );

  // Halo additif qui suit la bille (enfant du mesh).
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: NEON.bright, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0.75,
  }));
  glow.scale.set(BALL_RADIUS * 7, BALL_RADIUS * 7, 1);
  mesh.add(glow);

  scene.add(mesh);
  return mesh;
}
