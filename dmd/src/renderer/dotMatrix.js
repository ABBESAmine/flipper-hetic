/**
 * DMD — Rendu dot-matrix sur canvas.
 */
import { drawBitmapText, drawBitmapTextSmall } from "./font.js";

const DOT_COLS = 96;
const DOT_ROWS = 54;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DOT_RADIUS_RATIO = 0.35;
// LED color changed to green as requested
const DOT_ON = "#7AFB7B";
const DOT_OFF = "rgba(14, 129, 66, 0.16)";
const DISPLAY_BG = "#0d0401";
const TEXT_MARGIN = 2;
const TEXT_LINE_Y = Math.floor((DOT_ROWS - 7) / 2);
const TEXT_BG_PADDING = 1;
const TEXT_BG_OPACITY = 0.65;
const VISIBLE_TEXT_WIDTH = DOT_COLS - TEXT_MARGIN * 2;
const SCROLL_STEP_MS = 100;
const SCROLL_PAUSE_MS = 3000;

/**
 * Cree un renderer dot-matrix attache au canvas fourni.
 * Retourne des fonctions `renderMessage(text)`, `renderScore(score)`,
 * `updateStatus(status)`.
 */
export function createDotMatrixRenderer(canvas) {
  const ctx = canvas.getContext("2d");

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = CANVAS_WIDTH;
  imageCanvas.height = CANVAS_HEIGHT;
  const imageCtx = imageCanvas.getContext("2d", { willReadFrequently: true });

  const textMaskCanvas = document.createElement("canvas");
  textMaskCanvas.width = DOT_COLS;
  textMaskCanvas.height = DOT_ROWS;
  const textMaskCtx = textMaskCanvas.getContext("2d", { willReadFrequently: true });

  const dmdState = {
    message: "PRESS START",
    score: 0,
    status: "idle",
  };

  const scrollState = {
    offsetX: TEXT_MARGIN,
    direction: -1,
    pauseUntil: 0,
    lastUpdate: performance.now(),
    active: false,
    textWidth: 0,
  };

  // Load pixel-art image from dmd/img — draw it full-screen on the real 16:9 canvas
  const img = new Image();
  let imgLoaded = false;
  let imgNaturalW = 0;
  let imgNaturalH = 0;
  img.onload = () => {
    imgLoaded = true;
    imgNaturalW = img.naturalWidth;
    imgNaturalH = img.naturalHeight;
    render();
  };
  img.onerror = () => {
    // silently ignore
  };
  img.src = "/img/BB-Pixel-DMD.jpg";

  function normalizeMessage(input) {
    const src = typeof input === "string" ? input : "";
    const up = src.trim().toUpperCase();
    if (!up) return "PRESS START";
    return up.slice(0, 16);
  }

  function measureTextWidth(text) {
    if (!text) return 0;
    return text.length * 5 + Math.max(0, text.length - 1);
  }

  function getDisplayMessage() {
    if (dmdState.status === "playing" || dmdState.status === "game_over") {
      return "";
    }
    return dmdState.message || "PRESS START";
  }

  function getScoreText() {
    return `PTS ${String(dmdState.score).slice(0, 8)}`;
  }

  function resetTextScroll(text) {
    const normalized = (text || "").toUpperCase().slice(0, 16);
    const width = measureTextWidth(normalized);
    scrollState.textWidth = width;
    scrollState.offsetX = TEXT_MARGIN;
    scrollState.direction = -1;
    scrollState.lastUpdate = performance.now();
    scrollState.pauseUntil = performance.now() + SCROLL_PAUSE_MS;
    scrollState.active = width > VISIBLE_TEXT_WIDTH;
  }

  function updateTextScroll(now) {
    if (!scrollState.active) {
      return;
    }
    if (now < scrollState.pauseUntil) {
      return;
    }
    if (now - scrollState.lastUpdate < SCROLL_STEP_MS) {
      return;
    }

    scrollState.lastUpdate = now;
    const minOffset = Math.min(TEXT_MARGIN, VISIBLE_TEXT_WIDTH - scrollState.textWidth + TEXT_MARGIN);
    if (scrollState.direction === -1) {
      scrollState.offsetX = Math.max(minOffset, scrollState.offsetX - 1);
      if (scrollState.offsetX <= minOffset) {
        scrollState.offsetX = minOffset;
        scrollState.pauseUntil = now + SCROLL_PAUSE_MS;
        scrollState.direction = 1;
      }
    } else {
      scrollState.offsetX = Math.min(TEXT_MARGIN, scrollState.offsetX + 1);
      if (scrollState.offsetX >= TEXT_MARGIN) {
        scrollState.offsetX = TEXT_MARGIN;
        scrollState.pauseUntil = now + SCROLL_PAUSE_MS;
        scrollState.direction = -1;
      }
    }
  }

  function render() {
    imageCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    textMaskCtx.clearRect(0, 0, DOT_COLS, DOT_ROWS);
    textMaskCtx.fillStyle = "#ffffff";

    // If image loaded, draw it full-screen in the 16:9 canvas and preserve the entire image.
    if (imgLoaded) {
      const scaleH = CANVAS_HEIGHT / imgNaturalH || 1;
      const scaleW = CANVAS_WIDTH / imgNaturalW || 1;
      const scale = Math.min(scaleH, scaleW); // contain

      const drawW = Math.max(1, Math.round(imgNaturalW * scale));
      const drawH = Math.max(1, Math.round(imgNaturalH * scale));
      const dstX = Math.round((CANVAS_WIDTH - drawW) / 2);
      const dstY = Math.round((CANVAS_HEIGHT - drawH) / 2);

      try {
        imageCtx.drawImage(img, 0, 0, imgNaturalW, imgNaturalH, dstX, dstY, drawW, drawH);
      } catch (e) {
        // ignore
      }
    }

    const message = getDisplayMessage();
    let textX = TEXT_MARGIN;
    let textWidth = 0;
    if (message) {
      textWidth = measureTextWidth(message);
      textX = scrollState.active
        ? Math.floor(scrollState.offsetX)
        : Math.floor((DOT_COLS - textWidth) / 2);
      drawBitmapText(textMaskCtx, message, textX, TEXT_LINE_Y, { spacing: 1 });
    } else {
      const scoreText = getScoreText();
      textWidth = measureTextWidth(scoreText);
      textX = Math.floor((DOT_COLS - textWidth) / 2);
      drawBitmapText(textMaskCtx, scoreText, textX, TEXT_LINE_Y, { spacing: 1 });
    }

    const imagePixels = imageCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
    const textPixels = textMaskCtx.getImageData(0, 0, DOT_COLS, DOT_ROWS).data;
    const dotPitchX = canvas.width / DOT_COLS;
    const dotPitchY = canvas.height / DOT_ROWS;
    const dotRadius = Math.min(dotPitchX, dotPitchY) * DOT_RADIUS_RATIO;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = DISPLAY_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.25;
    ctx.drawImage(imageCanvas, 0, 0);
    ctx.globalAlpha = 1;

    if (textWidth > 0) {
      const textRectX = Math.max(0, textX * dotPitchX - TEXT_BG_PADDING * dotPitchX);
      const textRectY = Math.max(0, TEXT_LINE_Y * dotPitchY - TEXT_BG_PADDING * dotPitchY);
      const textRectW = Math.min(canvas.width - textRectX, (textWidth + TEXT_BG_PADDING * 2) * dotPitchX);
      const textRectH = Math.min(canvas.height - textRectY, (7 + TEXT_BG_PADDING * 2) * dotPitchY);
      ctx.fillStyle = `rgba(0, 0, 0, ${TEXT_BG_OPACITY})`;
      ctx.fillRect(textRectX, textRectY, textRectW, textRectH);
    }

    for (let y = 0; y < DOT_ROWS; y += 1) {
      for (let x = 0; x < DOT_COLS; x += 1) {
        const sampleX = Math.min(CANVAS_WIDTH - 1, Math.round((x + 0.5) * (CANVAS_WIDTH / DOT_COLS)));
        const sampleY = Math.min(CANVAS_HEIGHT - 1, Math.round((y + 0.5) * (CANVAS_HEIGHT / DOT_ROWS)));
        const idx = (sampleY * CANVAS_WIDTH + sampleX) * 4;
        const imgR = imagePixels[idx + 0];
        const imgG = imagePixels[idx + 1];
        const imgB = imagePixels[idx + 2];
        const imgA = imagePixels[idx + 3];
        const textA = textPixels[(y * DOT_COLS + x) * 4 + 3];
        const drawX = x * dotPitchX + dotPitchX / 2;
        const drawY = y * dotPitchY + dotPitchY / 2;
        let fillStyle = DOT_OFF;
        let shadowColor = "transparent";
        let shadowBlur = 0;

        if (textA > 0) {
          // draw a black outline behind text dots for better contrast
          ctx.beginPath();
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.arc(drawX, drawY, dotRadius * 1.2, 0, Math.PI * 2);
          ctx.fill();

          fillStyle = DOT_ON;
          shadowColor = "rgba(255, 122, 42, 0.7)";
          shadowBlur = 6;
          ctx.beginPath();
          ctx.fillStyle = fillStyle;
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = shadowBlur;
          ctx.arc(drawX, drawY, dotRadius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          continue;
        } else if (imgA > 16) {
          fillStyle = `rgba(${imgR}, ${imgG}, ${imgB}, 0.9)`;
        }

        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.arc(drawX, drawY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
  }

  function animate(now) {
    updateTextScroll(now);
    render();
    requestAnimationFrame(animate);
  }

  return {
    renderMessage(text) {
      dmdState.message = normalizeMessage(text);
      if (dmdState.status === "idle") {
        resetTextScroll(dmdState.message);
      }
      render();
    },

    renderScore(score) {
      dmdState.score = Number.isFinite(score) ? score : 0;
      render();
    },

    updateStatus(status) {
      dmdState.status = status ?? "idle";
      if (dmdState.status === "idle") {
        resetTextScroll(getDisplayMessage());
      }
    },

    /** Rendu initial. */
    init() {
      resetTextScroll(getDisplayMessage());
      render();
      requestAnimationFrame(animate);
    },
  };
}
