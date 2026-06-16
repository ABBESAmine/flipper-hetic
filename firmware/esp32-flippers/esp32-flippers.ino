#include <Arduino.h>

// ---- Pins boutons digitaux (INPUT_PULLUP : LOW = appuye) ----
static const uint8_t PIN_FLIPPER_LEFT  = 16;  // boutton black left  -> PL / RL
static const uint8_t PIN_FLIPPER_RIGHT = 13;  // boutton black right -> PR / RR
static const uint8_t PIN_START         = 17;  // button front green  -> ST (impulsion)

// ---- Pin plunger analogique (potentiometre / tirette) ----
// ADC1_CH4 sur ESP32 : compatible WiFi (ADC2 le serait pas).
static const uint8_t PIN_PLUNGER       = 32;

// Seuils ADC plunger (resolution 12 bits, 0..4095).
// Le joueur tire la tirette -> la valeur monte ; au relachement, le ressort la
// ramene au repos et on emet "LA". Hysteresis pour eviter les declenchements
// parasites lies au bruit ADC.
static const int PLUNGER_ARM_THRESHOLD     = 2500; // tire suffisamment loin
static const int PLUNGER_RELEASE_THRESHOLD = 800;  // revenu au repos
static const unsigned long PLUNGER_REARM_MS = 250; // delai mini entre 2 tirs

static const unsigned long DEBOUNCE_MS = 8;

enum ButtonMode {
  MODE_HOLD,   // envoie press + release (flippers)
  MODE_PULSE,  // envoie un seul code a l'appui (start)
};

struct Button {
  uint8_t pin;
  ButtonMode mode;
  const char *pressCode;
  const char *releaseCode; // ignore si MODE_PULSE
  bool pressed;
  bool lastReading;
  unsigned long lastChangeMs;
};

Button buttons[] = {
  { PIN_FLIPPER_LEFT,  MODE_HOLD,  "PL", "RL", false, false, 0 },
  { PIN_FLIPPER_RIGHT, MODE_HOLD,  "PR", "RR", false, false, 0 },
  { PIN_START,         MODE_PULSE, "ST", "",   false, false, 0 },
};

static const size_t BUTTON_COUNT = sizeof(buttons) / sizeof(buttons[0]);

// Etat plunger
static bool plungerArmed = false;
static unsigned long plungerLastFireMs = 0;

void setup() {
  Serial.begin(115200);
  for (size_t i = 0; i < BUTTON_COUNT; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  analogReadResolution(12);
  // Pas de pull sur la pin analogique : le potentiometre fournit la tension.
}

void loop() {
  const unsigned long now = millis();

  // ---- Boutons digitaux ----
  for (size_t i = 0; i < BUTTON_COUNT; i++) {
    Button &b = buttons[i];

    const bool reading = (digitalRead(b.pin) == LOW);

    if (reading != b.lastReading) {
      b.lastReading = reading;
      b.lastChangeMs = now;
    }

    if ((now - b.lastChangeMs) >= DEBOUNCE_MS && reading != b.pressed) {
      b.pressed = reading;
      if (b.mode == MODE_HOLD) {
        Serial.println(b.pressed ? b.pressCode : b.releaseCode);
      } else if (b.pressed) {
        Serial.println(b.pressCode);
      }
    }
  }

  // ---- Plunger analogique ----
  const int value = analogRead(PIN_PLUNGER);

  if (!plungerArmed && value >= PLUNGER_ARM_THRESHOLD) {
    plungerArmed = true;
  } else if (plungerArmed && value <= PLUNGER_RELEASE_THRESHOLD
             && (now - plungerLastFireMs) >= PLUNGER_REARM_MS) {
    plungerArmed = false;
    plungerLastFireMs = now;
    Serial.println("LA");
  }
}
