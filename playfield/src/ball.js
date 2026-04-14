import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  BALL_RADIUS,
  BALL_MASS,
  BALL_LINEAR_DAMPING,
  BALL_ANGULAR_DAMPING,
  PLUNGER_SPAWN_X,
  PLUNGER_SPAWN_Y,
  PLUNGER_SPAWN_Z,
} from "./constants.js";
import { MATERIALS } from "./physics.js";

/**
 * Cree la bille (mesh + body) et retourne des helpers de gameplay.
 */
export function createBall(scene, world) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.6, roughness: 0.2 }),
  );
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: BALL_MASS,
    shape: new CANNON.Sphere(BALL_RADIUS),
    material: MATERIALS.ball,
    linearDamping: BALL_LINEAR_DAMPING,
    angularDamping: BALL_ANGULAR_DAMPING,
  });
  body.position.set(PLUNGER_SPAWN_X, PLUNGER_SPAWN_Y, PLUNGER_SPAWN_Z);
  body.userData = { type: "ball" };
  world.addBody(body);

  world.addContactMaterial(
    new CANNON.ContactMaterial(MATERIALS.ball, MATERIALS.static, {
      friction: 0.28,
      restitution: 0.04,
    }),
  );
  world.addContactMaterial(
    new CANNON.ContactMaterial(MATERIALS.ball, MATERIALS.table, {
      friction: 0.28,
      restitution: 0.05,
    }),
  );

  function resetBall() {
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.position.set(PLUNGER_SPAWN_X, PLUNGER_SPAWN_Y, PLUNGER_SPAWN_Z);
    body.quaternion.set(0, 0, 0, 1);
    body.wakeUp();
  }

  return { mesh, body, resetBall };
}
