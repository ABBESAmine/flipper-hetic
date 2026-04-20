export function createActuators() {
  const counts = {
    bumperHit: 0,
    slingshotHit: 0,
    flipperFire: { left: 0, right: 0 },
    ballLost: 0,
    gameStart: 0,
  };

  return {
    onBumperHit() {
      counts.bumperHit++;
      console.log(`[actuator] bumper_hit #${counts.bumperHit}`);
    },

    onSlingshotHit() {
      counts.slingshotHit++;
      console.log(`[actuator] slingshot_hit #${counts.slingshotHit}`);
    },

    /** @param {"left"|"right"} side */
    onFlipperFire(side) {
      counts.flipperFire[side] = (counts.flipperFire[side] ?? 0) + 1;
      console.log(`[actuator] flipper_fire side=${side} #${counts.flipperFire[side]}`);
    },

    onBallLost() {
      counts.ballLost++;
      console.log(`[actuator] ball_lost #${counts.ballLost}`);
    },

    onGameStart() {
      counts.gameStart++;
      console.log(`[actuator] game_start #${counts.gameStart}`);
    },
    getCounts() {
      return structuredClone(counts);
    },
  };
}
