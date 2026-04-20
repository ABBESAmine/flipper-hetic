import { describe, it, expect, beforeEach } from "vitest";
import { createActuators } from "../adapters/actuators.js";

let actuators;

beforeEach(() => {
  actuators = createActuators();
});


describe("état initial", () => {
  it("1 — tous les compteurs démarrent à zéro", () => {
    const counts = actuators.getCounts();
    expect(counts.bumperHit).toBe(0);
    expect(counts.slingshotHit).toBe(0);
    expect(counts.flipperFire.left).toBe(0);
    expect(counts.flipperFire.right).toBe(0);
    expect(counts.ballLost).toBe(0);
    expect(counts.gameStart).toBe(0);
  });
});

describe("onBumperHit", () => {
  it("2 — incrémente bumperHit à chaque appel", () => {
    actuators.onBumperHit();
    expect(actuators.getCounts().bumperHit).toBe(1);

    actuators.onBumperHit();
    actuators.onBumperHit();
    expect(actuators.getCounts().bumperHit).toBe(3);
  });

  it("3 — n'affecte pas les autres compteurs", () => {
    actuators.onBumperHit();
    const counts = actuators.getCounts();
    expect(counts.slingshotHit).toBe(0);
    expect(counts.flipperFire.left).toBe(0);
    expect(counts.flipperFire.right).toBe(0);
    expect(counts.ballLost).toBe(0);
    expect(counts.gameStart).toBe(0);
  });
});

describe("onSlingshotHit", () => {
  it("4 — incrémente slingshotHit à chaque appel", () => {
    actuators.onSlingshotHit();
    expect(actuators.getCounts().slingshotHit).toBe(1);

    actuators.onSlingshotHit();
    expect(actuators.getCounts().slingshotHit).toBe(2);
  });

  it("5 — n'affecte pas bumperHit", () => {
    actuators.onSlingshotHit();
    expect(actuators.getCounts().bumperHit).toBe(0);
  });
});

describe("onFlipperFire", () => {
  it("6 — incrémente flipperFire.left pour le flipper gauche", () => {
    actuators.onFlipperFire("left");
    actuators.onFlipperFire("left");
    const counts = actuators.getCounts();
    expect(counts.flipperFire.left).toBe(2);
    expect(counts.flipperFire.right).toBe(0);
  });

  it("7 — incrémente flipperFire.right pour le flipper droit", () => {
    actuators.onFlipperFire("right");
    const counts = actuators.getCounts();
    expect(counts.flipperFire.right).toBe(1);
    expect(counts.flipperFire.left).toBe(0);
  });

  it("8 — les deux flippers sont indépendants", () => {
    actuators.onFlipperFire("left");
    actuators.onFlipperFire("left");
    actuators.onFlipperFire("right");
    const counts = actuators.getCounts();
    expect(counts.flipperFire.left).toBe(2);
    expect(counts.flipperFire.right).toBe(1);
  });
});

describe("onBallLost", () => {
  it("9 — incrémente ballLost à chaque appel", () => {
    actuators.onBallLost();
    expect(actuators.getCounts().ballLost).toBe(1);

    actuators.onBallLost();
    expect(actuators.getCounts().ballLost).toBe(2);
  });

  it("10 — n'affecte pas les autres compteurs", () => {
    actuators.onBallLost();
    const counts = actuators.getCounts();
    expect(counts.bumperHit).toBe(0);
    expect(counts.slingshotHit).toBe(0);
    expect(counts.gameStart).toBe(0);
  });
});

describe("onGameStart", () => {
  it("11 — incrémente gameStart à chaque appel", () => {
    actuators.onGameStart();
    actuators.onGameStart();
    expect(actuators.getCounts().gameStart).toBe(2);
  });
});

describe("getCounts", () => {
  it("12 — retourne un snapshot : la copie n'est pas affectée par des appels ultérieurs", () => {
    const snapshot = actuators.getCounts();
    actuators.onBumperHit();
    actuators.onBallLost();
    expect(snapshot.bumperHit).toBe(0);
    expect(snapshot.ballLost).toBe(0);
  });

  it("13 — deux instances createActuators() sont indépendantes", () => {
    const other = createActuators();
    actuators.onBumperHit();
    expect(other.getCounts().bumperHit).toBe(0);
  });
});
