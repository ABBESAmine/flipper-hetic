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

// Murs (segments [a,b]) — périmètre, arches, couloir de lancement, entonnoirs.
export const WALLS = [
  [{ x: 3, y: 10 }, { x: 3, y: 92 }],   // gauche
  [{ x: 3, y: 92 }, { x: 12, y: 99 }],  // arche haut-gauche
  [{ x: 12, y: 99 }, { x: 42, y: 99 }], // haut
  [{ x: 42, y: 99 }, { x: 52, y: 93 }], // arche haut-droite
  [{ x: 52, y: 8 }, { x: 52, y: 96 }],  // couloir de lancement (mur extérieur)
  [{ x: 44, y: 8 }, { x: 44, y: 84 }],  // séparateur couloir (partie pleine)
  [{ x: 44, y: 8 }, { x: 52, y: 8 }],   // fond du couloir
  // gate one-way réf (44,84)-(44,95) → laissée OUVERTE en v1 (sinon la bille
  // est piégée dans le couloir). Sortie du couloir vers le plateau par le haut.
  [{ x: 3, y: 40 }, { x: 8, y: 16 }],   // entonnoir gauche (vers flipper gauche)
  [{ x: 44, y: 40 }, { x: 33, y: 16 }], // entonnoir droit (vers flipper droit)
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

// Banque de cibles "HETIC" (scoring branché plus tard ; ici simples obstacles).
export const TARGET_HALF = 1.8;
export const TARGETS = ["H", "E", "T", "I", "C"].map((ch, i) => ({
  ch, x: 8 + i * 7.5, y: 89,
}));

// Gate one-way du couloir (réf 44,84→44,95) : mesh semi-transparent, sans
// collider en v1 (la bille la traverse pour sortir du couloir).
export const GATE = [{ x: 44, y: 84 }, { x: 44, y: 95 }];

// Chase lights : anneau de points sur le bord du cadre visible (réf).
export const CHASE = (() => {
  const ring = [];
  for (let x = 3; x <= 51; x += 4) ring.push({ x, y: 98 });    // haut
  for (let y = 92; y >= 12; y -= 7) ring.push({ x: 1.5, y });  // gauche
  for (let y = 92; y >= 12; y -= 7) ring.push({ x: 52.5, y }); // droite
  for (let x = 3; x <= 51; x += 4) ring.push({ x, y: 7 });     // bas
  return ring;
})();

// Spawn bille (couloir de lancement) et seuil de drain.
export const BALL_START = { x: 48, y: 11 };
export const DRAIN_Y = 5;
