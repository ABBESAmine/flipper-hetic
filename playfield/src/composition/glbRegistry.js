/**
 * Props remplaçables par un GLB.
 *
 * Pour activer un prop : déposez le fichier dans `playfield/public/models/`
 * (servi sur `/models/...`). Présent → remplace le mesh néon ; absent → fallback
 * procédural automatique.
 *
 * Props statiques (bumper, post) : `fitDiameter` auto-dimensionne le GLB à la
 * taille du collider et le pose au sol — pas besoin de régler `scale`.
 * `rotYDeg` reste utile si l'orientation à plat est mauvaise.
 *
 * `maps` applique des textures externes (PNG séparés) :
 *   - normalMap : relief
 *   - roughnessFromSmoothness : carte "smoothness" (inversée auto → roughness)
 *   - alphaMap : transparence/opacité
 */
export const GLB_PROPS = {
  bumper: {
    url: "/models/bumper.glb",
    fitDiameter: 1.3, // ≈ 2 × rayon collider bumper
    rotYDeg: 280,     // logo du couvercle remis droit (sens horaire vu de dessus)
    yOffset: 0,
    maps: {
      // Le fichier "transparency" contient en fait le motif de couleur (albédo).
      colorMap: "/models/bumper_transparency.png",
      normalMap: "/models/bumper_normal.png",
      roughnessFromSmoothness: "/models/bumper_smoothness.png",
      // Orientation UV : si le motif est décalé/retourné, basculer ce flag.
      flipY: true,
    },
  },
  post: {
    url: "/models/post.glb",
    fitDiameter: 0.5, // ≈ 2 × rayon collider post
    rotYDeg: 0,
    yOffset: 0,
  },
  // Un seul modèle de batte pour les deux flippers. La droite = la gauche
  // tournée de 180°. `fitLength` met la batte à la bonne longueur automatiquement.
  // Règle `rotYDeg` pour que la batte GAUCHE pointe vers +X (pivot à l'origine) ;
  // `xOffset`/`zOffset` recalent le pivot si l'origine du GLB n'y est pas.
  flipper: {
    url: "/models/flipper.glb",
    fitLength: 2.0, // ≈ FLIPPER_LENGTH
    rotYDeg: 0,
    xOffset: 0,
    yOffset: 0,
    zOffset: 0,
  },
};
