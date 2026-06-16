# Firmware ESP32 — flippers + start + plunger analogique

Lit les boutons physiques du cabinet et envoie les événements en série vers le
**playfield** (Web Serial). Pinout actuel :

| Entrée                         | GPIO | Type           | Codes série |
| :----------------------------- | :--: | :------------- | :---------- |
| Bouton **black left** (flipper G) | 16  | digital pull-up | `PL` / `RL` |
| Bouton **black right** (flipper D)| 13  | digital pull-up | `PR` / `RR` |
| Bouton **front green** (START)    | 17  | digital pull-up | `ST` (impulsion) |
| **Plunger** (lance-bille)         | 32  | **analogique** (ADC1_CH4) | `LA` (impulsion au relâchement) |

> Le cabinet expose aussi d'autres boutons (`white L=4`, `white R=25`,
> `front yellow=18`, `front red=19`, `front white=33`) — **non lus** par ce
> firmware. Ajouter une ligne dans le tableau `buttons[]` de
> `esp32-flippers.ino` pour les activer. Le décodage côté web supporte déjà
> `ST` (start), `LA` (launch) et `DBG` (reset debug).

> Compat : un firmware 1-bouton historique envoie `P` / `R` ; le playfield
> les traite comme le bouton **gauche**.

## Câblage

### Boutons digitaux (flippers + start)

Chaque bouton se branche entre sa broche GPIO et **GND**. Le firmware active
la résistance de tirage interne (`INPUT_PULLUP`), donc **aucune résistance
externe** : la broche lit `HIGH` au repos et `LOW` quand on appuie.

```
GPIO 16 ──[ black left  ]── GND   ; flipper gauche
GPIO 13 ──[ black right ]── GND   ; flipper droit
GPIO 17 ──[ front green ]── GND   ; START
```

### Plunger analogique (potentiomètre / tirette)

Le plunger renvoie une valeur entre `0` (repos) et `4095` (tiré à fond) sur
la pin **GPIO 32** (ADC1_CH4, compatible WiFi). Câblage typique d'un
potentiomètre linéaire en diviseur de tension :

```
3.3V ──┐
       ├── potentiometre plunger (curseur) ── GPIO 32
GND ───┘
```

> Pin 32 = ADC1, **ne pas** utiliser ADC2 (GPIO 0, 2, 4, 12-15, 25-27)
> simultanément avec le WiFi.

Logique de déclenchement (dans `esp32-flippers.ino`) :

1. Plunger au repos → valeur < `PLUNGER_RELEASE_THRESHOLD` (≈ 800).
2. Le joueur tire la tirette → valeur ≥ `PLUNGER_ARM_THRESHOLD` (≈ 2500) →
   plunger **armé** (rien n'est envoyé).
3. Le joueur relâche → ressort ramène la valeur sous `PLUNGER_RELEASE_THRESHOLD`
   → firmware émet **`LA`** une seule fois.
4. Délai mini de `PLUNGER_REARM_MS` (250 ms) avant de pouvoir retirer.

Ajuster les seuils en tête de fichier si les valeurs lues (via `Serial.print(value)`
en debug) ne correspondent pas à la course physique du potentiomètre.

## Téléversement

1. Ouvrir `esp32-flippers.ino` dans l'IDE Arduino (carte « ESP32 Dev Module »).
2. Vitesse série : **115200 bauds** (doit matcher `DEFAULT_BAUD_RATE` côté web).
3. Téléverser, puis fermer le moniteur série (il occupe le port).

## Connexion au jeu

Le playfield se connecte **automatiquement** à l'ESP32 :

- **Au démarrage**, il rouvre tout port déjà autorisé (`navigator.serial.getPorts()`).
- **À chaud**, il se rattache si l'ESP32 est branché après le chargement (événement `connect`).
- En cas de **débranchement**, il se reconnecte seul au rebranchement.

Les codes sont décodés par
[`playfield/src/adapters/webSerial.js`](../../playfield/src/adapters/webSerial.js)
(`SERIAL_PROTOCOL`), puis dispatchés via la couche d'input partagée avec le
clavier (`bindExternalInputSource`).

### Première autorisation (une seule fois par PC + origine)

L'API Web Serial **impose un geste utilisateur** pour autoriser un port la
toute première fois. Sur le PC du flipper, lancer le playfield (Chrome/Edge, en
`localhost` ou HTTPS), cliquer une fois sur **« Connecter ESP32 »** et choisir
le port. Ensuite, à chaque ouverture du jeu, la connexion est automatique —
plus aucun clic.

### Vrai zéro-clic (mode kiosque, optionnel)

Pour éviter même ce premier clic sur une borne dédiée, pré-autoriser l'origine
via une **politique Chrome/Edge** (`SerialAllowAllPortsForUrls`). `getPorts()`
renvoie alors le port sans aucune invite et l'auto-connexion est totale.

Windows — `HKLM\SOFTWARE\Policies\Google\Chrome` (ou `\Microsoft\Edge`), valeur
JSON `SerialAllowAllPortsForUrls` :

```json
["http://localhost:5173", "https://flipper.local"]
```

> Remplacer par l'origine réelle servant le playfield (port Vite ou domaine).
> La permission est mémorisée **par origine** : garder une URL stable évite de
> ré-autoriser.

## Debug rapide

Si rien ne se passe à l'écran quand on appuie sur un bouton :

1. Ouvrir le moniteur série Arduino (115200 baud) — vous devez voir `PL`/`RL`,
   `PR`/`RR`, `ST` ou `LA` à chaque action. Si oui, le firmware est OK ; le
   souci est côté navigateur (port occupé, autorisation manquante).
2. Fermer le moniteur série Arduino **avant** d'ouvrir le playfield (un seul
   process à la fois sur le port USB).
3. Vérifier dans la console Chrome : `[webSerial] ESP32 connecte — boutons actifs.`
4. Pour calibrer le plunger, ajouter temporairement `Serial.println(value);`
   dans la section plunger de la `loop()` et lire la plage min/max réelle.
