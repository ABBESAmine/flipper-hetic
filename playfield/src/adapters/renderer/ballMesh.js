/**
 * Playfield — Mesh Three.js de la bille.
 */
import * as THREE from "three";
import { BALL_RADIUS } from "../../domain/constants.js";
import { BB, glowTexture } from "./playfieldVisuals.js";

export function createBallMesh(scene) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xdfe2e6,
      emissive: 0x101216,
      emissiveIntensity: 0.3,
      metalness: 0.95,
      roughness: 0.15,
    }),
  );

  // Halo additif qui suit la bille (enfant du mesh) — reflet chaud discret.
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: BB.bright, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0.5,
  }));
  glow.scale.set(BALL_RADIUS * 7, BALL_RADIUS * 7, 1);
  mesh.add(glow);

  scene.add(mesh);
  return mesh;
}
