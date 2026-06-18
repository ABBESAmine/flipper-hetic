/**
 * Layout du playfield repris de PANDORMedia/fliphetic-pinball (site/js/table.js).
 *
 * Leur convention : plan X-Y (X = largeur 0..54, Y = remontée 0..104, Y=0 = drain),
 * gravité en -Y. La nôtre : plan X-Z (X = largeur, Z = longueur, -Z = haut,
 * +Z = bas/joueur), Y = hauteur/gravité.
 *
 * Mapping fixe ref(x,y) → nous(x,z) avec recentrage et mise à l'échelle. Leurs
 * proportions tombent quasi sur les nôtres (flipper 11 → ~2.0, balle 1.15 → ~0.21).
 */

// centerX = 21 (milieu des flippers réf, et non 27) → flippers centrés à l'écran,
// tout le layout (murs, entonnoirs, bumpers) recentré de façon cohérente.
export const REF = { width: 54, height: 104, centerX: 21, centerY: 52 };
export const SCALE = 0.18;

export const mapX = (x) => (x - REF.centerX) * SCALE;
export const mapZ = (y) => (REF.centerY - y) * SCALE; // +Y (haut) → -Z (haut)
export const mapPoint = (p) => ({ x: mapX(p.x), z: mapZ(p.y) });

// Périmètre rectangulaire (coins à angle droit). Face EXTERNE affleurant le bord
// du cadre visible 9:16 → aucun vide entre les murs et le bord, et le dessus du
// mur (épaisseur) reste visible : gauche x=2.4 (face ext ≈ -3.5 monde), droite
// x=52.4 (≈ 5.8), haut y=100 (≈ -8.79). Pas d'arches : coins hauts nets.
export const WALLS = [
  [{ x: 2.4, y: 8 }, { x: 2.4, y: 100 }],    // gauche
  [{ x: 2.4, y: 100 }, { x: 52.4, y: 100 }], // haut
  [{ x: 52.4, y: 100 }, { x: 52.4, y: 8 }],  // droite (mur extérieur couloir)
  [{ x: 44, y: 8 }, { x: 44, y: 84 }],       // séparateur couloir (partie pleine)
  [{ x: 44, y: 8 }, { x: 52.4, y: 8 }],      // fond du couloir
  // Déflecteur interne au sommet du couloir : diagonale qui courbe la bille
  // lancée vers la gauche dans le plateau. La bille sort par l'ouverture x=44
  // (y 84→~95) puis par-dessus le déflecteur vers la gauche.
  [{ x: 52.4, y: 93 }, { x: 40, y: 98 }],    // guide de lancement (couloir → plateau)
  // gate one-way réf (44,84)-(44,95) → laissée OUVERTE en v1 (sinon la bille
  // est piégée dans le couloir). Sortie du couloir vers le plateau par le haut.
  [{ x: 2.4, y: 40 }, { x: 8, y: 16 }],      // entonnoir gauche (vers flipper gauche)
  [{ x: 44, y: 40 }, { x: 33, y: 16 }],      // entonnoir droit (vers flipper droit)
];

// Slingshots (rebond actif au-dessus des flippers).
export const SLINGSHOTS = [
  [{ x: 13, y: 33 }, { x: 16, y: 21 }],
  [{ x: 41, y: 33 }, { x: 38, y: 21 }],
];

// Bumpers ronds.
export const BUMPER_RADIUS = 3.6;
export const BUMPERS = [{ x: 14, y: 68 }, { x: 28, y: 79 }, { x: 33, y: 63 }];

// Posts guides.
export const POST_RADIUS = 1.3;
export const POSTS = [{ x: 20, y: 28 }, { x: 28, y: 28 }];

// Gate one-way du couloir (réf 44,84→44,95) : mesh semi-transparent, sans
// collider en v1 (la bille la traverse pour sortir du couloir).
export const GATE = [{ x: 44, y: 84 }, { x: 44, y: 95 }];

// Zones spéciales (capteurs) — déclenchent les events DÉJÀ câblés au passage de
// la bille : `tunnel` = Tuco (+1000), `tunnel-rv` = RV (+5000). `color` est une
// clé de la palette BB ; `radius` est en unités réf (× SCALE → monde).
export const SPECIAL_ZONES = [
  { type: "tunnel",    label: "TUCO", color: "acid", x: 6,  y: 92, radius: 4.0 },
  { type: "tunnel-rv", label: "RV",   color: "meth", x: 39, y: 76, radius: 4.5 },
];

// Spawn bille (couloir de lancement) et seuil de drain.
export const BALL_START = { x: 48, y: 11 };
export const DRAIN_Y = 5;
