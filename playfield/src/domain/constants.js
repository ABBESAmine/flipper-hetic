/**
 * Convention d'axes (playfield 3D + Rapier) :
 *   X = gauche / droite
 *   Y = hauteur (perpendiculaire au plateau)
 *   Z = longueur du plateau (Z negatif = haut, Z positif = bas / joueur)
 *
 * La gravite inclinee est appliquee cote moteur physique (Rapier), pas en inclinant les meshes.
 */

// Plateau — allongé pour un footprint ~9:16 (cabinet portrait).
// On allonge UNIQUEMENT vers le haut (-Z) : le bord bas (flippers, drain,
// spawn, slingshots) garde sa position d'origine. TABLE_BOTTOM_Z est fixe,
// TABLE_TOP_Z dérive de la profondeur, et tout est recentré sur TABLE_CENTER_Z.
export const TABLE_WIDTH = 9.72;   // 54 (réf) × 0.18
export const TABLE_DEPTH = 18.72;  // 104 (réf) × 0.18
export const TABLE_THICKNESS = 0.5;
export const TABLE_BOTTOM_Z = 9.36;                            // bord bas (y=0 réf)
export const TABLE_TOP_Z = TABLE_BOTTOM_Z - TABLE_DEPTH;        // = -11.1
export const TABLE_CENTER_Z = (TABLE_TOP_Z + TABLE_BOTTOM_Z) / 2; // = -2.3

// Murs
export const WALL_HEIGHT = 1;
export const WALL_THICKNESS = 0.3;

// Drain (ouverture entre les futurs flippers)
export const DRAIN_OPENING_WIDTH = 2.5;

// Bille
export const BALL_RADIUS = 0.21;  // 1.15 (réf) × 0.18

// Tunnel de lancement (couloir vertical le long du mur droit, bas du plateau)
export const TUNNEL_WIDTH = 1.0;
export const TUNNEL_LENGTH = 3;
export const TUNNEL_WALL_X = TABLE_WIDTH / 2 - TUNNEL_WIDTH - WALL_THICKNESS / 2;
export const TUNNEL_WALL_Z = TABLE_BOTTOM_Z - TUNNEL_LENGTH / 2;

// Spawn bille — couloir de lancement réf (48, 11), recentré sur x=21
export const PLUNGER_SPAWN_X = 4.86;
export const PLUNGER_SPAWN_Y = 0.26;
export const PLUNGER_SPAWN_Z = 7.38;

// Plunger — force d'impulsion (Z negatif = vers le haut du plateau)
export const PLUNGER_IMPULSE_FORCE = 38;

// Flippers (battes) — pivots réf (9,18) et (33,18), symétriques autour de x=21
export const FLIPPER_LENGTH = 1.98;      // 11 (réf) × 0.18
export const FLIPPER_WIDTH = 0.4;
export const FLIPPER_HEIGHT = 0.3;
export const FLIPPER_REST_ANGLE = 0.45;  // radians (~26°)
export const FLIPPER_PIVOT_X = 2.16;     // demi-écart 12 (réf) × 0.18
export const FLIPPER_OFFSET_X = 0;       // centre des battes à X=0 (layout recentré sur x=21)
export const FLIPPER_PIVOT_Z = 6.12;     // y=18 réf → (52-18)×0.18
export const FLIPPER_PIVOT_Y = 0.3;
export const FLIPPER_ROT_X = 0.05235987755982989;  // radians (~3°), inclinaison des battes sur l'axe X
export const FLIPPER_ROT_Z = 0.017453292519943295;  // radians (~1°), inclinaison des battes sur l'axe Z

// Slingshots — murs inclines qui ferment le corridor lateral au-dessus des flippers
export const SLINGSHOT_DEPTH = 0.25;
export const SLINGSHOT_TOP_OFFSET = 2.4; // distance Z entre l'extremite haute et le pivot flipper

// Deflecteurs d'angle haut — diagonales dans les deux coins superieurs du plateau
export const CORNER_DEFLECTOR_SIZE = 2;     // longueur d'arete coupee sur X et sur Z
export const CORNER_DEFLECTOR_DEPTH = 0.25;

// Arche — arrondi en haut du playfield (remplace les deux coins carres)
// ARCH_RADIUS  : rayon de l'arche (TABLE_WIDTH / 2 = demi-largeur)
// ARCH_CENTER_Z: centre de l'arc en Z (bas de l'arche, rejoint les murs lateraux)
// ARCH_SEGMENTS: nombre de points pour approcher la courbe (10 = suffisant)
export const ARCH_RADIUS     = TABLE_WIDTH / 2;
export const ARCH_CENTER_Z   = -13.0;  // remonté avec le nouveau bord haut (TABLE_TOP_Z)
export const ARCH_HALF_WIDTH = 5.3;
export const ARCH_HALF_DEPTH = 3.1;
export const ARCH_HEIGHT     = 7.2;
export const ARCH_SEGMENTS   = 10;
export const ARCH_OFFSET_X   = 0;
export const ARCH_OFFSET_Z   = 5;
export const ARCH_ROT_Y      = 0;

// Bumpers
export const BUMPER_REPULSE_FORCE = 4;

// Slingshots — kick actif (impulsion radiale depuis le centre du segment)
export const SLINGSHOT_REPULSE_FORCE = 3;

// Drain — seuil Z au-dela duquel la bille est consideree perdue.
// Relatif au bord bas (fixe), pas à TABLE_DEPTH : l'allongement du plateau ne
// doit pas déplacer le seuil de drain.
export const DRAIN_Z_THRESHOLD = 8.46;  // y<5 réf → (52-5)×0.18, sous les flippers (Z=6.12)

// Flippers — vitesse de rotation (rad/s)
export const FLIPPER_SPEED = 15;

// Collisions — cooldown entre deux emissions du meme type (ms)
export const COLLISION_COOLDOWN_MS = 300;

// Rendu WebGL — cibles machines integrees / ecrans haute densite
/** Plafonne devicePixelRatio. Relevé à 2 pour supersampler le rendu (motifs des
 *  props nets, moins d'aliasing). Baisser à 1.5/1 si le cabinet rame. */
export const MAX_RENDERER_PIXEL_RATIO = 2;
/** Cible de supersampling minimale : force un rendu >= ce ratio même sur écran
 *  non hi-DPI (anti-aliasing par suréchantillonnage). Baisser si lag. */
export const MIN_RENDERER_PIXEL_RATIO = 1.75;
/** true = contours plus lisses (MSAA). Coût modéré, gros gain de netteté. */
export const RENDERER_ANTIALIAS = true;
