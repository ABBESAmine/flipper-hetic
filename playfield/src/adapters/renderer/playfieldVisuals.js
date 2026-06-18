/**
 * Visuels du playfield — meshes Three.js stylisés posés sur les colliders
 * existants. Direction artistique *Breaking Bad* : désert du Nouveau-Mexique +
 * labo clandestin (sable/ocre, bleu Heisenberg pour les features fort score,
 * jaune hazmat, rouille des barils). Adapté à notre convention d'axes
 * (X = largeur, Y = hauteur/gravité, Z = longueur).
 *
 * Principe : on ne recrée pas la géométrie à la main. On clone la géométrie des
 * meshes proxy (déjà calés sur les colliders) et on lit la transform depuis le
 * corps physique (fiable même si le proxy n'est positionné qu'au runtime).
 * Indépendant du système de debug : ces meshes-ci sont toujours visibles.
 */
import * as THREE from "three";

/** Palette Breaking Bad (cf. maquette). Les halos sont teintés par ces clés. */
export const BB = {
  meth: 0x27c7e8,   // bleu Heisenberg — features fort score, RV, cristaux
  acid: 0x7fb800,   // vert toxique — chimie, scoop Tuco
  hazmat: 0xf4d03f, // jaune hazmat — slingshots, prudence
  rust: 0xb7410e,   // rouille / danger — barils, murs
  sand: 0xc2a35b,   // sable désert — base
  bright: 0xfff1c4, // surbrillance chaude
  dim: 0x4a3b22,    // sable foncé — lignes de grille
};

/** Texture radiale réutilisée pour les halos (sprites additifs, teinte neutre
 * chaude → la couleur du sprite décide de la teinte finale). */
export function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,250,235,1)");
  grad.addColorStop(0.28, "rgba(255,235,180,0.6)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
