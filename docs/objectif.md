Objectif :
- Simulation physique réaliste : création d’une table 3D interactive avec Three.js et cannon.is pouvant agir de manière cohérente face aux collisions, la puissance/force des flippers et la gravité sans latence
- Assurer la synchronisation en temps réel (<50ms) de 3 appli distinctes (playfield, backglass et DMD) via serveur socket.io
- Pouvoir commander la bille via les commandes sur le clavier et intégration de contrôleurs physiques tel que ESP32 / Arduino pour piloter les solénoïdes du flipper réel lors de la soutenance
- Experience utilisateur immersive : créer un univers cohérent qui comprend des retours visuels dynamiques sur le dmd et le backglass à chaque score

Non objectifs : 
- Mode multi joueur en ligne 
- Les utilisateurs ne pourront pas modifier la disposition de la table (mur, jumper…)
- Utilisation sur une interface mobile

Personas : 
- Léa 22 ans 
    - Profil : Étudiante en développement Web à HETIC.
    - Besoin : Veut un projet techniquement stimulant qui combine Front-end 3D (Three.js) et logique serveur (WebSockets).
    - Objectif : Valider son module Web 3 avec une architecture propre et scalable.
- Marc 45 ans 
    - Profil : Nostalgique des salles d'arcade, organisateur d'événements.
    - Besoin : Cherche une simulation qui retrouve les sensations du flipper physique (réactivité, bruit, "Tilt").
    - Objectif : Tester une version moderne et connectée du flipper traditionnel lors d'un salon étudiant.
