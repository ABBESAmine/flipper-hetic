/**
 * Convention d'axes (coherente avec Cannon-es etape 5) :
 *   X = gauche / droite
 *   Y = hauteur (perpendiculaire au plateau) — axe de gravite Cannon-es (0, -9.82, 0)
 *   Z = longueur du plateau (Z negatif = haut du plateau, Z positif = bas / joueur)
 *
 * L'inclinaison (~6-7°) sera simulee dans Cannon-es via une composante Z
 * dans le vecteur de gravite, sans incliner les meshes Three.js.
 */

// Plateau
export const TABLE_WIDTH = 10;
export const TABLE_DEPTH = 18;
export const TABLE_THICKNESS = 0.5;

// Murs
export const WALL_HEIGHT = 1;
export const WALL_THICKNESS = 0.3;

// Drain (ouverture entre les futurs flippers)
export const DRAIN_OPENING_WIDTH = 2.5;

// Spawn bille (zone plunger, en bas a droite du plateau)
export const PLUNGER_SPAWN_X = TABLE_WIDTH / 2 - 0.8;
export const PLUNGER_SPAWN_Y = 0.5;
export const PLUNGER_SPAWN_Z = TABLE_DEPTH / 2 - 1;

// Bille
export const BALL_RADIUS = 0.17;
export const BALL_MASS = 0.1;
export const BALL_LINEAR_DAMPING = 0.007;
export const BALL_ANGULAR_DAMPING = 0.02;
export const LAUNCH_IMPULSE_Z = -9.5;
export const LAUNCH_MAX_SPEED = 18;

// Drain / perte de bille (zone de detection dans l'ouverture)
export const DRAIN_MIN_Z = TABLE_DEPTH / 2 - 0.4;
export const DRAIN_MAX_Z = TABLE_DEPTH / 2 + 1.2;
export const DRAIN_MIN_X = -DRAIN_OPENING_WIDTH / 2 - 0.15;
export const DRAIN_MAX_X = DRAIN_OPENING_WIDTH / 2 + 0.15;
export const DRAIN_MAX_Y = 0.2;

// Flippers
export const FLIPPER_LENGTH = 1.45;
export const FLIPPER_WIDTH = 0.28;
export const FLIPPER_HEIGHT = 0.18;
export const FLIPPER_REST_ANGLE = 0.9;
export const FLIPPER_PIVOT_X = 1.35;
export const FLIPPER_PIVOT_Z = TABLE_DEPTH / 2 - 1.4;
export const FLIPPER_PIVOT_Y = FLIPPER_HEIGHT / 2;
export const FLIPPER_SPEED = 18;

// Bumpers
export const BUMPER_RADIUS = 0.45;
export const BUMPER_HEIGHT = 0.28;
export const BUMPER_POSITIONS = [
  { x: -2.3, z: -4.8 },
  { x: 0, z: -6.0 },
  { x: 2.3, z: -4.8 },
];

// Anti-spam collisions reseau
export const COLLISION_COOLDOWN_MS = 120;
