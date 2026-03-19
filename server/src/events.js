// Événements client → serveur
export const CLIENT_EVENTS = {
    START_GAME: "start_game",
    LAUNCH_BALL: "launch_ball",
    FLIPPER_LEFT_DOWN: "flipper_left_down",
    FLIPPER_LEFT_UP: "flipper_left_up",
    FLIPPER_RIGHT_DOWN: "flipper_right_down",
    FLIPPER_RIGHT_UP: "flipper_right_up",
    BALL_LOST: "ball_lost",
    COLLISION: "collision",       // { type: "bumper" | "wall" | "flipper" | "drain" }
  };
  
  // Événements serveur → clients
  export const SERVER_EVENTS = {
    STATE_UPDATED: "state_updated",
    GAME_STARTED: "game_started",
    GAME_OVER: "game_over",
    DMD_MESSAGE: "dmd_message",
  };
  
  // État de jeu partagé
  export const INITIAL_STATE = {
    status: "idle",       // "idle" | "playing" | "game_over"
    score: 0,
    ballsLeft: 3,
    currentBall: 1,
    lastEvent: null,
  };