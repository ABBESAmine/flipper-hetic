# Stack technique — Résumé

| Couche        | Technologie        | Rôle principal                                   | Justification |
|--------------|-------------------|--------------------------------------------------|--------------|
| Frontend 3D  | Three.js          | Affichage du flipper en 3D dans le navigateur    | Web-native, compatible navigateurs, large documentation |
| Physique     | Cannon-es         | Gestion des collisions, gravité, rebonds         | Compatible Three.js, simple |
| Backend      | Node.js           | Gestion de l’état du jeu et synchronisation      | Même langage (JS), adapté au temps réel |
| Communication| WebSocket         | Synchronisation temps réel multi-écran           | Connexion persistante, rapide, idéale pour live |
| Hardware     | ESP32             | Lecture boutons physiques                        | WiFi intégré, simple à programmer |
| Outils       | GitHub + Vite + PlantUML | Versioning, dev rapide, UML                | Collaboration efficace et documentation claire |
