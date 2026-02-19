# Flipper Hetic

Flipper virtuel multi-écran : **Playfield** (3D), **Backglass**, **DMD**, synchronisés en temps réel via WebSocket.

## Architecture

```
├── server/
│   ├── package.json
│   └── src/
│       └── index.js          # Node.js + WebSocket, état du jeu
│
├── playfield/
│   ├── package.json
│   └── src/
│       └── main.js           # Three.js + Cannon-es (écran 3D)
│
├── backglass/
│   ├── package.json
│   └── src/
│       └── main.js           # Écran arrière (score, infos)
│
└── dmd/
    ├── package.json
    └── src/
        └── main.js           # Affichage type dot-matrix
```

## Démarrage

### Installation

À la racine et dans chaque app :

```bash
npm install
cd server   && npm install
cd playfield && npm install
cd backglass && npm install
cd dmd      && npm install
```

### Lancer les apps

- **Serveur** (obligatoire en premier) : `npm run server` → WebSocket sur `ws://localhost:3001`
- **Playfield** : `npm run playfield` → http://localhost:5173
- **Backglass** : `npm run backglass` → http://localhost:5174
- **DMD** : `npm run dmd` → http://localhost:5175

Tout en une commande : `npm run dev:all` (après `npm install` à la racine pour `concurrently`).

## Stack

Voir [docs/stack.md](docs/stack.md) — Three.js, Cannon-es, Node.js, WebSocket, ESP32 (hardware), Vite.
