# Plan de logs — Flipper Virtuel

Définition des traces (signaux, événements, stockage) produites pour observer et valider le bon fonctionnement du système : synchro multi-écrans, physique, état de jeu et diagnostic.

---

## 1. Objectifs des logs

| Objectif | Description |
|----------|-------------|
| **Valider le bon fonctionnement** | Vérifier que les use cases (démarrage partie, lancer bille, battes, game over, sync) se déroulent comme prévu. |
| **Observer ce qui se passe** | Comprendre le flux d’événements (qui envoie quoi, à quel moment). |
| **Mesurer la performance** | Contrôler la latence de synchro entre écrans (objectif < 50 ms). |
| **Déboguer** | Identifier les erreurs (connexion, état incohérent, collision non gérée). |

---

## 2. Où produire les traces

| Composant | Rôle des logs |
|-----------|----------------|
| **Server** | Connexions/déconnexions, réception d’inputs, broadcast d’état, erreurs WebSocket. |
| **Playfield** | Réception état serveur, envoi inputs (plunger, battes), collisions détectées, perte de bille. |
| **Backglass** | Connexion, réception état (score, balles), mise à jour affichage. |
| **DMD** | Connexion, réception état / messages, affichage (PRESS START, SCORE, GAME OVER). |

---

## 3. Signaux et événements à tracer

### 3.1 Connexion / communication

| Signal | Où | Quand | Données utiles |
|--------|-----|-------|----------------|
| Client connecté | Server | Connexion WebSocket | `clientId`, type (playfield / backglass / dmd) |
| Client déconnecté | Server | Fermeture WebSocket | `clientId`, raison si dispo |
| État broadcast | Server | À chaque envoi d’état | `score`, `balles`, `gameOver`, timestamp |
| État reçu | Playfield, Backglass, DMD | Réception message serveur | timestamp réception, délai éventuel vs envoi |

### 3.2 Événements métier (gameplay)

| Signal | Où | Quand | Données utiles |
|--------|-----|-------|----------------|
| Partie démarrée | Server | Action “démarrer partie” | — |
| Bille lancée (plunger) | Server + Playfield | Input plunger | — |
| Batteur gauche / droit | Server + Playfield | Input batteur | `left` / `right` |
| Bille perdue | Playfield → Server | Bille sort du playfield | `balles` restantes |
| Game Over | Server | balles = 0 ou condition fin | `score` final |
| Score mis à jour | Server | Après collision / règle métier | `score`, cause |

### 3.3 Physique et collisions (Playfield)

| Signal | Où | Quand | Données utiles |
|--------|-----|-------|----------------|
| Collision détectée | Playfield | Contact bille / obstacle | type (mur, bumper, batteur, trou), id cible si dispo |
| Collision non reconnue | Playfield | Contact non typé (extension UC07) | log erreur, pas de blocage |

### 3.4 Performance et synchronisation

| Signal | Où | Quand | Données utiles |
|--------|-----|-------|----------------|
| Latence broadcast | Server | Envoi état | timestamp envoi (pour calcul délai côté client) |
| Latence perçue | Playfield / Backglass / DMD | Réception état | `receivedAt - sentAt` si timestamp serveur inclus |
| Alerte latence > 50 ms | Client ou Server | Si délai dépasse seuil | valeur mesurée, composant |

### 3.5 Erreurs et cas limites

| Signal | Où | Quand | Données utiles |
|--------|-----|-------|----------------|
| Erreur WebSocket | Server, clients | Connexion / envoi / réception en échec | message d’erreur, code |
| État incohérent | Server | Ex. action en Game Over, balles négatives | état actuel, action refusée |
| Erreur physique / bille | Playfield | Bille hors map, corps invalide | contexte (position, vélocité) |

---

## 4. Format des traces

Format ligne de log lisible et parseable :

```
[timestamp] [niveau] [composant] message données
```

Exemples :

- `[2025-02-26T10:00:01.123Z] [INFO] [server] client connected type=playfield id=abc123`
- `[2025-02-26T10:00:05.456Z] [INFO] [server] state broadcast score=1500 balles=2 gameOver=false`
- `[2025-02-26T10:00:05.458Z] [INFO] [playfield] state received latencyMs=12`
- `[2025-02-26T10:00:06.000Z] [INFO] [playfield] collision type=bumper`
- `[2025-02-26T10:00:10.000Z] [WARN] [backglass] latency above threshold latencyMs=62`

Niveaux : `DEBUG`, `INFO`, `WARN`, `ERROR`.

---

## 5. Stockage et exploitation

| Environnement | Stockage | Usage |
|---------------|----------|--------|
| **Développement** | Console (stdout / stderr) | Lecture directe, debug. |
| **Démo / soutenance** | Fichier log (ex. `logs/flipper-YYYY-MM-DD.log`) | Relecture pour démontrer le bon déroulement et la latence. |
| **Production** | Hors scope MVP. | — |

Pour **valider** le bon fonctionnement et la synchro < 50 ms : timestamps côté serveur (envoi) et côté client (réception) permettent de calculer le délai et de le tracer (voir § 3.4).

---

## 6. Synthèse : ce qu’on valide avec ces traces

- **Connexion** : tous les clients (playfield, backglass, dmd) se connectent et reçoivent l’état.
- **Gameplay** : démarrage partie, lancement bille, battes, perte de bille, game over, score.
- **Physique** : collisions typées (mur, bumper, batteur, trou) et cas non reconnus loggés.
- **Synchronisation** : latence mesurée et alertes si > 50 ms.
- **Robustesse** : erreurs WebSocket et états incohérents tracés pour le diagnostic.
