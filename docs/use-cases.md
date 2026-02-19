# Use Cases

| ID    | Nom                                      | Acteur   | But |
|-------|-------------------------------------------|----------|-----|
| UC01  | Insérer une pièce (optionnel)            | Joueur   | Permettre au joueur de créditer la machine |
| UC02  | Démarrer une partie                      | Joueur   | Lancer une nouvelle partie |
| UC03  | Lancer la bille                          | Joueur   | Envoyer la bille sur le playfield |
| UC04  | Contrôler le batteur droit               | Joueur   | Activer le batteur droit |
| UC05  | Contrôler le batteur gauche              | Joueur   | Activer le batteur gauche |
| UC06  | Terminer la partie (Game Over)           | Système  | Mettre fin à la partie |
| UC07  | Détecter les différents types de collisions | Système | Identifier les collisions dans le jeu |
| UC08  | Détecter la perte de la bille            | Système  | Identifier que la bille est sortie du playfield |
| UC09  | Synchroniser les 3 écrans                | Système  | Maintenir la cohérence entre Playfield, Backglass et DMD |
| UC10  | Gérer les combos                         | Système  | Appliquer des bonus liés aux enchaînements |
| UC11  | Gérer le score                           | Système  | Calculer et mettre à jour le score |
| UC12  | Détecter la secousse du flipper          | Système  | Identifier une action de secousse (nudge) |
| UC13  | Jouer effets sonores                     | Système  | Activer certains sons attribués à certaines interactions |
| UC14  | Jouer musique de fond                    | Système  | Musique de fond en continu |

---

# Use Cases détaillés

---

## UC07 : Détecter les différents types de collisions

### Scénario nominal

1. La bille se déplace sur le playfield.  
2. Le système détecte une collision (avec un bumper, un batteur, un mur ou un trou).  
3. Le système identifie le type de collision.  
4. Le système déclenche l’événement associé (ex : ajout de points, animation, message).  
5. Le système envoie l’information nécessaire aux écrans pour affichage (Backglass/DMD).  

### Extensions

1. Collisions multiples très rapides : le système regroupe ou limite les événements pour éviter le spam.  
2. Collision non reconnue : le système ignore l’événement ou log l’erreur sans bloquer le jeu.  
3. Collision dans un état non valide (Game Over) : le système ignore la collision.  

### Postconditions

1. La collision est traitée.  
2. Les événements associés (score/affichage/feedback) sont déclenchés.  
3. L’état du jeu reste cohérent.