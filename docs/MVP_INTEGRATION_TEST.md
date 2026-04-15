# Integration MVP - Procedure de test

Ce document valide le flux complet serveur + playfield + backglass + DMD.

## 1) Lancement des 4 applications

Depuis la racine du repo, commande unique :

```bash
npm run dev:all
```

Alternative (si besoin de logs separes), ouvrir 4 terminaux :

```bash
cd server && npm run dev
```

```bash
cd playfield && npm run dev
```

```bash
cd backglass && npm run dev
```

```bash
cd dmd && npm run dev
```

URLs attendues :

- Playfield: `http://localhost:5173`
- Backglass: `http://localhost:5174`
- DMD: `http://localhost:5175`

## 2) Scenario manuel de reference

1. Ouvrir les 3 ecrans (playfield/backglass/dmd) dans le navigateur.
2. Dans le playfield, cliquer une fois pour donner le focus clavier.
3. Appuyer sur `Enter`.
   - Attendu serveur: reception `start_game`, puis `state_updated(status=playing)`.
   - Attendu DMD: message `BALL 1`.
   - Attendu backglass: `status=playing`, `score=0`, `ballsLeft=3`.
4. Appuyer sur `Space`.
   - Attendu serveur: reception `launch_ball` + `state_updated(lastEvent=launch_ball)`.
   - Attendu playfield: la bille est lancee depuis la zone plunger.
5. Jouer avec `ArrowLeft` et `ArrowRight`.
   - Attendu serveur: events flippers relays.
   - Attendu collisions bumpers/murs/flippers: emission `collision { type }`.
   - Attendu score: incremente sur `collision:bumper` (+100 en MVP), visible sur backglass et DMD.
6. Laisser la bille tomber dans le drain.
   - Attendu serveur: `ball_lost`, `ballsLeft` decremente.
   - Attendu DMD: `BALL 2`, puis `BALL 3` apres nouvelle perte.
   - Attendu playfield: respawn de bille pour la balle suivante.
7. A la 3e perte de bille.
   - Attendu serveur: `state_updated(status=game_over)` + `game_over`.
   - Attendu DMD: `GAME OVER`.
   - Attendu backglass: `status=game_over`, `ballsLeft=0`.
8. Restart.
   - Appuyer de nouveau sur `Enter`.
   - Attendu: retour `status=playing`, score reset, message `BALL 1`.

## 3) Checklist DoD integration

- [ ] Une procedure unique permet de lancer les 4 apps.
- [ ] `Enter` declenche bien `start_game` + synchro 3 ecrans.
- [ ] `Space` declenche `launch_ball` avec lancement coherent.
- [ ] Collisions bumpers/flippers/murs emettent des evenements sans spam excessif.
- [ ] Drain emet `ball_lost` une fois par perte + respawn correct.
- [ ] 3 pertes conduisent a `game_over` coherent sur les 3 ecrans.
- [ ] Restart possible sans redemarrer les apps.
