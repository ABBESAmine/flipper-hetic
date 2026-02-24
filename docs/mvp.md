Objectif :
Un flipper virtuel moderne qui recréé l'expérience d'une vraie machine d'arcade en utilisant 3 écrans synchronisés. Celui-ci permettant aux passionés d'arcade comme Marc de revivre des moments de nostalgies dans la modernité. 

MVP 5 points clés : 
- Appuyer sur un bouton pour démarrer une partie puis appuyer sur un bouton pour lancer la bille 
- La bille doit suivre des mouvements cohérents au monde réel (gravité, changement de trajectoire suite aux chocs avec les obstacles et les murs...)
- 2 battes en bas de map permettant de renvoyer la bille sont activables via un bouton chacun
- La game doit commencer au lancé de la bille et se terminer dès que la bille tombe 
- Les 3 écrans doivent être synchro (affichage du résultat en temps réel, activation d'une décoration/ambiance au lancement de la game, cohérence dans l'affichage des messages "PRESS START" , "SCORE : 1500" , "BALL 2" , "GAME OVER"...)

Ce que les 3 écrans doivents afficher : 
- Ecran principal :
    - écran de gameplay dans lequel on voit la map, la bille, les battes, les murs .... le gameplay quoi
- 2nd écran :
    - écran décoratif pour l'ambiance
    - affiche le meilleur score
- 3e écran : 
    - affiche des messages courts : "PRESS START" , "SCORE : 1500" , "BALL 2" , "GAME OVER" ...

Les touches : 
- espace pour lancer la bille 
- flèche de gauche pour activer la batte gauche et flèche de droite pour activer la batte droite

Critères de succès mesurable :
- Une bonne latence permettant un délai de synchro entre l'écran principla et l'écran d'affichage inférieur à 50ms
- Il faut que tous les chocs de la bille avec l'environnement de la map soient détectées et qu'il y ai l'aspect soumission à la gravité
- Tous les merges vers le pull request doivent avoir au moins une review validée


Contraintes : 
- Hardware -> code fait pour jouer sur clavier mais doit etre capable d'intégrer ESP32/Arduino afin de recevoir les commandes provenant d'une vraie carte électronique style bouton physique de flipper
- Travail de groupe -> interdit de push sur le main direct et on doit respecter le process de "bon commit"
- Interface -> projet fait pour jouer sur desktop, on perd pas de temps a l'adapter sur telephone



Top 3 risques + Plan B : 
- Perte de la synchro des écrans -> au lieu d'envoyer toutes les info tlt (position, vitesse ...) on envoie uniqueemnt les infos importantes (ex : bumper touché, bille perdue ...) afin d'alléger le reseau et rester sous 50ms
- Choc de la bille non détectée (faisant sortir la bille de la map) -> 
- Gestion des 3 fenêtres navigateurs trop lourde -> créer une nouvelle vue de secours qui regroupe les 3 écrans sur une seule page 




