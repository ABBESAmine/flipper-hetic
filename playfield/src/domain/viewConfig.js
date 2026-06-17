/**
 * Ratio d'affichage cible du cabinet (écran flipper portrait 9:16, ex. 1080×1920).
 * Le rendu est letterboxé à ce ratio : aucune déformation, et sur l'écran
 * cabinet (déjà 9:16) le cadre remplit exactement la dalle.
 */
export const PLAYFIELD_TARGET_ASPECT = 9 / 16;

export const PLAYFIELD_VIEW_DEFAULTS = {
  cameraMode: "orthographic",
  cameraPosX: 0,
  cameraPosY: 20,
  // Inclinaison ~18° depuis la verticale (Z = Y·tan18° ≈ 6.5). Léger relief sur
  // les props sans foreshortening : un plateau ~9:16 remplit la dalle sans
  // sur-zoom. (Ancienne valeur 22.6 ≈ 48° → écrasait l'axe Z à ~66%.)
  cameraPosZ: 6.5,
  lookAtX: 0,
  lookAtY: 0,
  lookAtZ: 0,
  cameraUpX: 0,
  cameraUpY: 0,
  cameraUpZ: -1,
  fov: 60,
  orthoZoom: 1.1,
  near: 0.1,
  far: 100,

  // ── Cadrage 9:16 ──────────────────────────────────────────────────────────
  // Rectangle de jeu à cadrer, exprimé en coordonnées LOCALES du levelGroup
  // (avant offset/rotation du groupe). La caméra ortho est zoomée pour que ce
  // rectangle remplisse le cadre 9:16. À ajuster pour décider où tombe le
  // rognage (cf. frameFitMode).
  // Cadre = bornes réelles du terrain (mur gauche X≈-3.24 → couloir droit X≈5.58,
  // arches Z≈-8.46 → zone drain Z≈8.1), petite marge → le terrain remplit la
  // dalle 9:16, murs au bord. Le couloir de lancement décale le centre du terrain
  // ~1 unité à droite des flippers (inhérent au layout réf).
  frameMinX: -3.5,
  frameMaxX: 5.8,
  frameMinZ: -8.7,
  frameMaxZ: 8.6,
  frameY: 0,
  // "cover"  → le rectangle remplit tout l'écran ; le trop-plein (l'axe le plus
  //            large) déborde et est rogné. C'est le mode "remplit parfaitement".
  // "contain" → tout le rectangle est visible ; des marges apparaissent sur
  //            l'axe le plus étroit.
  frameFitMode: "cover",
  // 1.0 = le rectangle touche les bords. < 1.0 = petite bordure de sécurité.
  frameMargin: 1.0,
  levelPosX: 0,
  levelPosY: 0,   // physique et visuel alignés (le GLB qui imposait 3.4 est retiré)
  levelPosZ: 0,
  levelRotX: 0,
  levelRotY: 0,
  levelRotZ: 0,
  gravityTiltDeg: 20,    // pente plus marquée → bille moins flottante
  gravityMagnitude: 45,  // poussée plus forte (descente ~45·sin20 ≈ 15, proche réf)
  ambientIntensity: 0.6,
  dirLightX: 5,
  dirLightY: 15,
  dirLightZ: 5,
  dirLightIntensity: 0.8,
};

const DEG = Math.PI / 180;

export function applyViewConfigToPerspectiveCamera(
  camera,
  config = PLAYFIELD_VIEW_DEFAULTS,
) {
  camera.fov = config.fov;
  camera.near = config.near;
  camera.far = config.far;
  camera.position.set(config.cameraPosX, config.cameraPosY, config.cameraPosZ);
  camera.up.set(config.cameraUpX, config.cameraUpY, config.cameraUpZ).normalize();
  camera.lookAt(config.lookAtX, config.lookAtY, config.lookAtZ);
  camera.updateProjectionMatrix();
}

export function applyViewConfigToLevelGroup(
  group,
  config = PLAYFIELD_VIEW_DEFAULTS,
) {
  group.position.set(config.levelPosX, config.levelPosY, config.levelPosZ);
  group.rotation.set(
    config.levelRotX * DEG,
    config.levelRotY * DEG,
    config.levelRotZ * DEG,
  );
}
