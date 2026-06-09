import {
  TABLE_WIDTH,
  TABLE_DEPTH,
  TABLE_THICKNESS,
  WALL_HEIGHT,
  WALL_THICKNESS,
  TUNNEL_LENGTH,
  TUNNEL_WALL_X,
  TUNNEL_WALL_Z,
} from "../domain/constants.js";
import { createTableMeshes } from "../adapters/renderer/tableMesh.js";
import { createBallMesh } from "../adapters/renderer/ballMesh.js";
import { createFlipperMeshes } from "../adapters/renderer/flipperMesh.js";
import { createLaunchGateMesh } from "../adapters/renderer/launchGateMesh.js";
import {
  createStaticBoxBody,
  createBallBody,
  createFlipperBodies,
  createLaunchGateBody,
} from "../adapters/physics/index.js";
import { loadPlayfieldModel } from "../adapters/renderer/modelLoader.js";

function createWallBody(world, w, h, d, x, y, z) {
  return createStaticBoxBody(world, {
    width: w,
    height: h,
    depth: d,
    position: { x, y, z },
  });
}

export async function buildLevel({ scene, world }) {
  const syncPairs = [];

  const gltfModel = await loadPlayfieldModel();

  const tableMeshes = createTableMeshes(scene);
  for (const m of tableMeshes) m.visible = false;

  const tableBody = createStaticBoxBody(world, {
    width: TABLE_WIDTH,
    height: TABLE_THICKNESS,
    depth: TABLE_DEPTH,
    position: { x: 0, y: -TABLE_THICKNESS / 2, z: 0 },
    material: "table",
    type: "table",
  });
  syncPairs.push({ mesh: tableMeshes[0], body: tableBody });

  const wallLeftBody = createWallBody(
    world,
    WALL_THICKNESS, WALL_HEIGHT, TABLE_DEPTH,
    -TABLE_WIDTH / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0,
  );
  syncPairs.push({ mesh: tableMeshes[1], body: wallLeftBody });

  const wallRightBody = createWallBody(
    world,
    WALL_THICKNESS, WALL_HEIGHT, TABLE_DEPTH,
    TABLE_WIDTH / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0,
  );
  syncPairs.push({ mesh: tableMeshes[2], body: wallRightBody });

  const wallTopBody = createWallBody(
    world,
    TABLE_WIDTH + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS,
    0, WALL_HEIGHT / 2, -TABLE_DEPTH / 2 - WALL_THICKNESS / 2,
  );
  syncPairs.push({ mesh: tableMeshes[3], body: wallTopBody });

  const tunnelWallBody = createWallBody(
    world,
    WALL_THICKNESS, WALL_HEIGHT, TUNNEL_LENGTH,
    TUNNEL_WALL_X, WALL_HEIGHT / 2, TUNNEL_WALL_Z,
  );
  syncPairs.push({ mesh: tableMeshes[6], body: tunnelWallBody });

  const ballMesh = createBallMesh(scene);
  const ballBody = createBallBody(world);
  syncPairs.push({ mesh: ballMesh, body: ballBody });

  const flipperMeshes = createFlipperMeshes(scene);
  const flipperBodies = createFlipperBodies(world);
  syncPairs.push(
    { mesh: flipperMeshes.left,  body: flipperBodies.left.body },
    { mesh: flipperMeshes.right, body: flipperBodies.right.body },
  );

  const launchGateMesh = createLaunchGateMesh(scene);
  const launchGateBody = createLaunchGateBody(world);
  syncPairs.push({ mesh: launchGateMesh, body: launchGateBody });

  return {
    syncPairs,
    ballMesh,
    ballBody,
    flipperBodies,
    launchGateBody,
    gltfModel,
  };
}
