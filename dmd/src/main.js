import { io } from "socket.io-client";

const app = document.createElement("main");
app.className = "dmd";
app.innerHTML = `
  <section class="dmd__screen" aria-live="polite">
    <canvas id="dmdCanvas" class="dmd__canvas" aria-label="Dot matrix display"></canvas>
  </section>
`;

document.body.append(app);

const styles = document.createElement("style");
styles.textContent = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: #050505;
    color: #ff5a1f;
    font-family: "Courier New", Courier, monospace;
  }

  .dmd {
    width: min(920px, 94vw);
    padding: 1rem;
  }

  .dmd__screen {
    border: 3px solid #ff7a2a;
    border-radius: 10px;
    padding: 0.8rem;
    background: #120701;
    box-shadow: 0 0 24px rgba(255, 90, 31, 0.25) inset;
  }

  .dmd__canvas {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 6px;
    background: #0d0401;
  }
`;
document.head.append(styles);

const DOT_COLS = 96;
const DOT_ROWS = 24;
const DOT_PITCH = 10;
const DOT_RADIUS = 2.9;
const DOT_ON = "#ff7a2a";
const DOT_OFF = "rgba(255, 122, 42, 0.08)";
const DISPLAY_BG = "#0d0401";

const canvas = document.getElementById("dmdCanvas");
const ctx = canvas.getContext("2d");

canvas.width = DOT_COLS * DOT_PITCH;
canvas.height = DOT_ROWS * DOT_PITCH;

const rasterCanvas = document.createElement("canvas");
rasterCanvas.width = DOT_COLS;
rasterCanvas.height = DOT_ROWS;
const rasterCtx = rasterCanvas.getContext("2d", { willReadFrequently: true });

const dmdState = {
  message: "PRESS START",
  score: 0,
};

function writeCenteredText(text, y, font) {
  rasterCtx.font = font;
  rasterCtx.textAlign = "center";
  rasterCtx.textBaseline = "middle";
  rasterCtx.fillStyle = "#ffffff";
  rasterCtx.fillText(text, DOT_COLS / 2, y);
}

function renderMessage(text) {
  dmdState.message = typeof text === "string" && text.trim() ? text.toUpperCase() : "READY";
  renderDotMatrix();
}

function renderScore(score) {
  dmdState.score = Number.isFinite(score) ? score : 0;
  renderDotMatrix();
}

function renderDotMatrix() {
  rasterCtx.clearRect(0, 0, DOT_COLS, DOT_ROWS);

  // Ligne principale DMD + ligne score lisible en bas.
  writeCenteredText(dmdState.message, 8, "bold 9px monospace");
  writeCenteredText(`PTS ${dmdState.score}`, 19, "bold 7px monospace");

  const pixels = rasterCtx.getImageData(0, 0, DOT_COLS, DOT_ROWS).data;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = DISPLAY_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < DOT_ROWS; y += 1) {
    for (let x = 0; x < DOT_COLS; x += 1) {
      const idx = (y * DOT_COLS + x) * 4;
      // Seuil plus strict pour garder les "trous" des caractères (0, O...).
      const isOn = pixels[idx + 3] > 170;
      const drawX = x * DOT_PITCH + DOT_PITCH / 2;
      const drawY = y * DOT_PITCH + DOT_PITCH / 2;

      ctx.beginPath();
      ctx.fillStyle = isOn ? DOT_ON : DOT_OFF;
      ctx.shadowColor = isOn ? "rgba(255, 122, 42, 0.7)" : "transparent";
      ctx.shadowBlur = isOn ? 6 : 0;
      ctx.arc(drawX, drawY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.shadowBlur = 0;
}

const socket = io("http://localhost:3000");

socket.on("dmd_message", (payload) => {
  renderMessage(payload?.text);
});

socket.on("state_updated", (nextState) => {
  renderScore(nextState?.score);
});

renderDotMatrix();
