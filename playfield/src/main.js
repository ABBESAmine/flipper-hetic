import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  TABLE_WIDTH,
  TABLE_DEPTH,
  TABLE_THICKNESS,
  WALL_HEIGHT,
  WALL_THICKNESS,
  DRAIN_OPENING_WIDTH,
  PLUNGER_SPAWN_X,
  PLUNGER_SPAWN_Y,
  PLUNGER_SPAWN_Z,
  LAUNCH_IMPULSE_Z,
  LAUNCH_MAX_SPEED,
} from "./constants.js";
import {
  createPhysicsWorld,
  createStaticBoxBody,
  syncMeshesWithBodies,
  FIXED_TIME_STEP,
  MAX_SUB_STEPS,
} from "./physics.js";
import { createBumpers } from "./bumpers.js";
import {
  createFlippers,
  setFlipperActive,
  updateFlippers,
  postStepFlippers,
} from "./flippers.js";
import { createBall } from "./ball.js";
import {
  initNetwork,
  gameState,
  emitStartGame,
  emitLaunchBall,
  emitFlipperLeftDown,
  emitFlipperLeftUp,
  emitFlipperRightDown,
  emitFlipperRightUp,
  emitBallLost,
  emitCollision,
} from "./network.js";
import {
  attachCollisionEmitter,
  createDrainWatcher,
  detectDrain,
} from "./collisions.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, -1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 15, 5);
scene.add(dirLight);

const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "8px";
hud.style.left = "8px";
hud.style.padding = "8px 10px";
hud.style.background = "rgba(0,0,0,0.45)";
hud.style.color = "#fff";
hud.style.fontFamily = "monospace";
hud.style.fontSize = "12px";
hud.style.borderRadius = "8px";
hud.style.pointerEvents = "none";
document.body.appendChild(hud);

const tableMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

const world = createPhysicsWorld();
const syncPairs = [];
const drainWatcher = createDrainWatcher();
let pendingRespawn = false;
let ball = null;

const socket = initNetwork({
  onStateUpdated: () => {
    hud.textContent = `status=${gameState.status} score=${gameState.score} balls=${gameState.ballsLeft} last=${gameState.lastEvent ?? "-"}`;
    if (gameState.status === "playing" && pendingRespawn) {
      ball?.resetBall();
      drainWatcher.canLoseBall = true;
      pendingRespawn = false;
    }
    if (gameState.status === "playing" && gameState.lastEvent === "start_game") {
      ball?.resetBall();
      drainWatcher.canLoseBall = true;
      pendingRespawn = false;
    }
    if (gameState.status === "game_over") {
      pendingRespawn = false;
      drainWatcher.canLoseBall = true;
      ball?.resetBall();
    }
  },
});

function addStaticBoxVisual(width, height, depth, x, y, z, type = "wall", material = wallMat, physicsMaterial = "static") {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  const body = createStaticBoxBody(world, {
    width,
    height,
    depth,
    position: { x, y, z },
    material: physicsMaterial,
    type,
  });
  syncPairs.push({ mesh, body });
}

function addStaticAngledBoxVisual({
  width,
  height,
  depth,
  x,
  y,
  z,
  angleY,
  type = "wall",
  material = wallMat,
  physicsMaterial = "static",
}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = angleY;
  scene.add(mesh);

  const body = createStaticBoxBody(world, {
    width,
    height,
    depth,
    position: { x, y, z },
    material: physicsMaterial,
    type,
  });
  const q = new CANNON.Quaternion();
  q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angleY);
  body.quaternion.copy(q);

  syncPairs.push({ mesh, body });
}


addStaticBoxVisual(TABLE_WIDTH, TABLE_THICKNESS, TABLE_DEPTH, 0, -TABLE_THICKNESS / 2, 0, "table", tableMat, "table");
addStaticBoxVisual(WALL_THICKNESS, WALL_HEIGHT, TABLE_DEPTH, -TABLE_WIDTH / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0);
addStaticBoxVisual(WALL_THICKNESS, WALL_HEIGHT, TABLE_DEPTH, TABLE_WIDTH / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0);
addStaticBoxVisual(TABLE_WIDTH + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS, 0, WALL_HEIGHT / 2, -TABLE_DEPTH / 2 - WALL_THICKNESS / 2);
// Retenue invisible au-dessus des murs (evite les sorties hors plateau).
addStaticBoxVisual(TABLE_WIDTH + 0.4, 0.16, 0.16, 0, 1.02, -TABLE_DEPTH / 2 + 0.05, "wall", new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), "static");
addStaticBoxVisual(TABLE_WIDTH + 0.4, 0.16, 0.16, 0, 1.02, TABLE_DEPTH / 2 - 0.05, "wall", new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), "static");
addStaticBoxVisual(0.16, 0.16, TABLE_DEPTH + 0.4, -TABLE_WIDTH / 2 + 0.05, 1.02, 0, "wall", new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), "static");
addStaticBoxVisual(0.16, 0.16, TABLE_DEPTH + 0.4, TABLE_WIDTH / 2 - 0.05, 1.02, 0, "wall", new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), "static");

// Angles "arrondis" en haut (chamfreins diagonaux), comme sur le schema.
addStaticAngledBoxVisual({
  width: 3.0,
  height: WALL_HEIGHT,
  depth: WALL_THICKNESS,
  x: -TABLE_WIDTH / 2 + 1.2,
  y: WALL_HEIGHT / 2,
  z: -TABLE_DEPTH / 2 + 1.05,
  angleY: 0.52,
});
addStaticAngledBoxVisual({
  width: 3.0,
  height: WALL_HEIGHT,
  depth: WALL_THICKNESS,
  x: TABLE_WIDTH / 2 - 1.2,
  y: WALL_HEIGHT / 2,
  z: -TABLE_DEPTH / 2 + 1.05,
  angleY: -0.52,
});

const bottomWallWidth = (TABLE_WIDTH - DRAIN_OPENING_WIDTH) / 2;
const bottomZ = TABLE_DEPTH / 2 + WALL_THICKNESS / 2;
addStaticBoxVisual(bottomWallWidth, WALL_HEIGHT, WALL_THICKNESS, -(DRAIN_OPENING_WIDTH / 2 + bottomWallWidth / 2), WALL_HEIGHT / 2, bottomZ);
addStaticBoxVisual(bottomWallWidth, WALL_HEIGHT, WALL_THICKNESS, DRAIN_OPENING_WIDTH / 2 + bottomWallWidth / 2, WALL_HEIGHT / 2, bottomZ);

// Tunnel droit (couloir de lancement) du haut vers le bas du playfield.
addStaticBoxVisual(
  WALL_THICKNESS,
  WALL_HEIGHT,
  11.0,
  TABLE_WIDTH / 2 - 1.35,
  WALL_HEIGHT / 2,
  3.0,
);
// Butee basse du tunnel pour eviter le trou vers l'exterieur.
addStaticBoxVisual(
  1.2,
  WALL_HEIGHT,
  WALL_THICKNESS,
  TABLE_WIDTH / 2 - 0.6,
  WALL_HEIGHT / 2,
  TABLE_DEPTH / 2 + WALL_THICKNESS / 2,
);

// Fausse vitre : couvre l'integralite du flipper (largeur + longueur).
addStaticBoxVisual(
  TABLE_WIDTH - 0.3,
  0.04,
  TABLE_DEPTH - 0.3,
  0,
  1.95,
  0,
  "glass",
  new THREE.MeshStandardMaterial({
    color: 0xaecbff,
    transparent: true,
    opacity: 0.14,
    metalness: 0.1,
    roughness: 0.2,
  }),
  "table",
);

// Guides anti-blocage au-dessus des flippers (orientation vers le bas/centre).
addStaticAngledBoxVisual({
  width: 4.8,
  height: WALL_HEIGHT,
  depth: 0.32,
  x: -3.22,
  y: WALL_HEIGHT / 2,
  z: TABLE_DEPTH / 2 - 2.0,
  angleY: -0.46,
});
addStaticAngledBoxVisual({
  width: 2.25,
  height: WALL_HEIGHT,
  depth: 0.32,
  x: 2.28,
  y: WALL_HEIGHT / 2,
  z: TABLE_DEPTH / 2 - 2.0,
  angleY: 0.46,
});

const bumpers = createBumpers(scene, world);
syncPairs.push(...bumpers);

const flippers = createFlippers(scene, world);
syncPairs.push(
  { mesh: flippers.left.mesh, body: flippers.left.body },
  { mesh: flippers.right.mesh, body: flippers.right.body },
);

ball = createBall(scene, world);
syncPairs.push({ mesh: ball.mesh, body: ball.body });

attachCollisionEmitter(ball.body, (type) => emitCollision(socket, type));

function tryLaunch() {
  if (gameState.status !== "playing") return;
  const speed = ball.body.velocity.length();
  if (speed > 1.4) return;
  const dx = ball.body.position.x - PLUNGER_SPAWN_X;
  const dy = ball.body.position.y - PLUNGER_SPAWN_Y;
  const dz = ball.body.position.z - PLUNGER_SPAWN_Z;
  const distFromSpawn = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (distFromSpawn > 2.1) return;

  emitLaunchBall(socket);
  ball.body.wakeUp();
  ball.body.applyImpulse(new CANNON.Vec3(0, 0.08, LAUNCH_IMPULSE_Z), ball.body.position);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.code === "Enter") {
    emitStartGame(socket);
    return;
  }

  if (event.code === "Space") {
    tryLaunch();
    return;
  }

  if (event.code === "ArrowLeft") {
    setFlipperActive(flippers, "left", true);
    emitFlipperLeftDown(socket);
    return;
  }

  if (event.code === "ArrowRight") {
    setFlipperActive(flippers, "right", true);
    emitFlipperRightDown(socket);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft") {
    setFlipperActive(flippers, "left", false);
    emitFlipperLeftUp(socket);
    return;
  }
  if (event.code === "ArrowRight") {
    setFlipperActive(flippers, "right", false);
    emitFlipperRightUp(socket);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());

  updateFlippers(flippers);
  world.step(FIXED_TIME_STEP, dt, MAX_SUB_STEPS);
  postStepFlippers(flippers);

  if (ball.body.velocity.length() > LAUNCH_MAX_SPEED) {
    ball.body.velocity.scale(LAUNCH_MAX_SPEED / ball.body.velocity.length(), ball.body.velocity);
  }

  const lost = detectDrain(ball.body, drainWatcher);
  if (lost && gameState.status === "playing") {
    emitCollision(socket, "drain");
    emitBallLost(socket);
    pendingRespawn = true;
    ball.body.velocity.set(0, 0, 0);
    ball.body.angularVelocity.set(0, 0, 0);
    ball.body.position.set(0, -4, 0);
  }

  // Garde-fou: si la bille sort des limites du plateau, compter une perte de bille.
  const outOfBounds =
    Math.abs(ball.body.position.x) > TABLE_WIDTH * 0.75 ||
    ball.body.position.z < -TABLE_DEPTH * 0.65 ||
    ball.body.position.z > TABLE_DEPTH * 0.62;
  if (outOfBounds && gameState.status === "playing" && drainWatcher.canLoseBall) {
    drainWatcher.canLoseBall = false;
    emitBallLost(socket);
    pendingRespawn = true;
    ball.body.velocity.set(0, 0, 0);
    ball.body.angularVelocity.set(0, 0, 0);
    ball.body.position.set(0, -4, 0);
  }

  syncMeshesWithBodies(syncPairs);
  renderer.render(scene, camera);
}

animate();
