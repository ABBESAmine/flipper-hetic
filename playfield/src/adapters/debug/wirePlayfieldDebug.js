import { DEBUG_ENABLED } from "./config.js";
import { createDebugUI } from "./ui.js";
import { createAudioDebugUI } from "./audioDebug.js";
import { createPlayfieldDebugUI } from "./playfieldDebug.js";
import {
  PLAYFIELD_VIEW_DEFAULTS,
  applyViewConfigToPerspectiveCamera,
  applyViewConfigToLevelGroup,
} from "../../domain/viewConfig.js";

const DEG = Math.PI / 180;

export function wirePlayfieldDebug(deps) {
  if (!DEBUG_ENABLED) {
    console.log("[debug] disabled via config");
    return;
  }

  const { viewRuntime, audio, onResetHighScore, onResetBall, level } = deps;

  const onConfigChange = (config) => {
    Object.assign(viewRuntime.params, config);
    viewRuntime.apply();
    console.log("[debug] config applied", config);
  };

  createDebugUI({ onConfigChange, onResetHighScore, onResetBall });
  if (audio) {
    createAudioDebugUI(audio);
  }
  if (level) {
    createPlayfieldDebugUI({
      gltfModel:     level.gltfModel,
      flipperBodies: level.flipperBodies,
      ballBody:      level.ballBody,
      world:         deps.world,
    });
  }

  console.log("[debug] menu initialized — press ` to toggle");
}
