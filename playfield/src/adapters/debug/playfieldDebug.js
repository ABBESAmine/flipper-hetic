import {
  FLIPPER_PIVOT_X, FLIPPER_PIVOT_Z, FLIPPER_PIVOT_Y, FLIPPER_REST_ANGLE,
  FLIPPER_ROT_X, FLIPPER_ROT_Z, FLIPPER_OFFSET_X,
  PLUNGER_SPAWN_X, PLUNGER_SPAWN_Y, PLUNGER_SPAWN_Z,
} from '../../domain/constants.js';
import { PLAYFIELD_VIEW_DEFAULTS } from '../../domain/viewConfig.js';
import { applyPhysicsGravity } from '../physics/rapier/world.js';

const DEG = Math.PI / 180;

export function createPlayfieldDebugUI({ gltfModel, flipperBodies, ballBody, world, onConfigChange, physicsRotateY, setPhysicsDebugVisible }) {
  const defaults = {
    pivotX:       FLIPPER_PIVOT_X,
    pivotY:       FLIPPER_PIVOT_Y,
    pivotZ:       FLIPPER_PIVOT_Z,
    offsetX:      FLIPPER_OFFSET_X,
    restAngle:    FLIPPER_REST_ANGLE,
    flipperRotX:  FLIPPER_ROT_X / DEG,
    flipperRotZ:  FLIPPER_ROT_Z / DEG,
    spawnX:    PLUNGER_SPAWN_X,
    spawnY:    PLUNGER_SPAWN_Y,
    spawnZ:    PLUNGER_SPAWN_Z,
    gravityTilt: PLAYFIELD_VIEW_DEFAULTS.gravityTiltDeg,
    gravityMag:  PLAYFIELD_VIEW_DEFAULTS.gravityMagnitude,
    frameMinX:   PLAYFIELD_VIEW_DEFAULTS.frameMinX,
    frameMaxX:   PLAYFIELD_VIEW_DEFAULTS.frameMaxX,
    frameMinZ:   PLAYFIELD_VIEW_DEFAULTS.frameMinZ,
    frameMaxZ:   PLAYFIELD_VIEW_DEFAULTS.frameMaxZ,
    frameMargin: PLAYFIELD_VIEW_DEFAULTS.frameMargin,
  };

  const state = { ...defaults };

  function quatFromYaw(a) { const h = a / 2; return { x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) }; }
  function quatFromAxis(ax, ay, az, a) { const h = a / 2, s = Math.sin(h); return { x: ax*s, y: ay*s, z: az*s, w: Math.cos(h) }; }
  function mulQuat(a, b) {
    return {
      x: a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
      y: a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
      z: a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w,
      w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
    };
  }
  function composeRot(yaw, rx, rz) {
    return mulQuat(mulQuat(quatFromYaw(yaw), quatFromAxis(1, 0, 0, rx)), quatFromAxis(0, 0, 1, rz));
  }
  function qTiltFrom(rx, rz) {
    return mulQuat(quatFromAxis(1, 0, 0, rx), quatFromAxis(0, 0, 1, rz));
  }

  function applyGravity() {
    if (!world) return;
    applyPhysicsGravity(world, state.gravityTilt, state.gravityMag);
  }

  function applyFrame() {
    onConfigChange?.({
      frameMinX:   state.frameMinX,
      frameMaxX:   state.frameMaxX,
      frameMinZ:   state.frameMinZ,
      frameMaxZ:   state.frameMaxZ,
      frameMargin: state.frameMargin,
    });
  }

  function applyBall() {
    if (!ballBody?.rb) return;
    ballBody.rb.setBodyType(2, true);
    ballBody.rb.setTranslation({ x: state.spawnX, y: state.spawnY, z: state.spawnZ }, true);
    ballBody.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ballBody.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    ballBody.userData.launched = false;
  }

  function applyFlippers() {
    if (!flipperBodies) return;
    const { left, right } = flipperBodies;
    const px = state.pivotX;
    const ox = state.offsetX;
    const rx = state.flipperRotX * DEG;
    const rz = state.flipperRotZ * DEG;
    const qTilt = qTiltFrom(rx, rz);
    left.body.rb.setTranslation({ x: -px + ox, y: state.pivotY, z: state.pivotZ }, true);
    right.body.rb.setTranslation({ x:  px + ox, y: state.pivotY, z: state.pivotZ }, true);
    left.restAngle   = -state.restAngle; left.activeAngle   = state.restAngle;  left.currentAngle   = left.restAngle;
    right.restAngle  =  state.restAngle; right.activeAngle  = -state.restAngle; right.currentAngle  = right.restAngle;
    left.rotX  = rx; left.rotZ  = rz; left.qTilt  = qTilt;
    right.rotX = rx; right.rotZ = rz; right.qTilt = qTilt;
    left.body.rb.setRotation(composeRot(left.restAngle, rx, rz), true);
    right.body.rb.setRotation(composeRot(right.restAngle, rx, rz), true);
  }

  const SECTIONS = [
    {
      title: '▸ Flippers',
      rows: [
        { key: 'pivotZ',      label: 'Pivot Z',       min: 0,    max: 18,   step: 0.05, apply: applyFlippers },
        { key: 'pivotY',      label: 'Pivot Y',       min: -2,   max: 2,    step: 0.05, apply: applyFlippers },
        { key: 'offsetX',     label: 'Center X',      min: -6,   max: 6,    step: 0.05, apply: applyFlippers },
        { key: 'pivotX',      label: 'Half Gap',      min: 0,    max: 8,    step: 0.05, apply: applyFlippers },
        { key: 'restAngle',   label: 'Rest Angle',    min: 0,    max: 3.14, step: 0.01, apply: applyFlippers },
        { key: 'flipperRotX', label: 'Rotation X°',   min: -90,  max: 90,   step: 1,    apply: applyFlippers },
        { key: 'flipperRotZ', label: 'Rotation Z°',   min: -90,  max: 90,   step: 1,    apply: applyFlippers },
      ],
    },
    {
      title: '▸ Ball Spawn',
      rows: [
        { key: 'spawnX', label: 'Spawn X', min: -6,  max: 6,  step: 0.05, apply: applyBall },
        { key: 'spawnZ', label: 'Spawn Z', min: 0,   max: 12, step: 0.05, apply: applyBall },
      ],
    },
    {
      title: '▸ Gravity',
      rows: [
        { key: 'gravityTilt', label: 'Tilt (°)',    min: -45, max: 45, step: 0.5, apply: applyGravity },
        { key: 'gravityMag',  label: 'Magnitude',   min: 0,   max: 90, step: 0.5, apply: applyGravity },
      ],
    },
    {
      title: '▸ Frame 9:16',
      rows: [
        { key: 'frameMinX',   label: 'Min X',        min: -12, max: 0,   step: 0.1,  apply: applyFrame },
        { key: 'frameMaxX',   label: 'Max X',        min: 0,   max: 12,  step: 0.1,  apply: applyFrame },
        { key: 'frameMinZ',   label: 'Min Z (haut)', min: -16, max: 0,   step: 0.1,  apply: applyFrame },
        { key: 'frameMaxZ',   label: 'Max Z (bas)',  min: 0,   max: 16,  step: 0.1,  apply: applyFrame },
        { key: 'frameMargin', label: 'Marge',        min: 0.5, max: 1.2, step: 0.01, apply: applyFrame },
      ],
    },
  ];

  const panel = document.createElement('div');
  panel.style.cssText = [
    'position:fixed;top:50px;left:10px;width:420px',
    'max-height:calc(100vh - 70px);overflow-y:auto',
    'background:rgba(10,10,20,.96);border:1px solid #0ff;border-radius:4px',
    'padding:10px;color:#0ff;font:11px \'Courier New\',monospace',
    'z-index:10000;box-shadow:0 0 16px rgba(0,255,255,.25);display:none',
  ].join(';');

  const hdr = document.createElement('div');
  hdr.style.cssText = 'font-weight:bold;margin-bottom:8px;font-size:12px';
  hdr.textContent = '[PFD] Playfield Debug';
  panel.appendChild(hdr);

  const RESET_BTN = 'padding:1px 5px;background:transparent;color:#0ff;border:1px solid #0ff;border-radius:3px;cursor:pointer;font-size:11px;flex-shrink:0;line-height:1.4';

  const allOnChange = [];

  function makeRow(row) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:5px';

    const lbl = document.createElement('span');
    lbl.style.cssText = 'flex:0 0 95px';
    lbl.textContent = row.label;
    wrap.appendChild(lbl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = row.min; slider.max = row.max; slider.step = row.step; slider.value = state[row.key];
    slider.style.cssText = 'flex:1;cursor:pointer;accent-color:#0ff';
    wrap.appendChild(slider);

    const num = document.createElement('input');
    num.type = 'number'; num.value = state[row.key]; num.step = row.step;
    num.style.cssText = 'width:55px;background:#0a0a14;color:#0ff;border:1px solid #0ff;padding:2px';
    wrap.appendChild(num);

    const onChange = (v) => {
      const val = parseFloat(v);
      if (isNaN(val)) return;
      state[row.key] = val; slider.value = val; num.value = val;
      row.apply?.();
    };

    slider.addEventListener('input', () => onChange(slider.value));
    num.addEventListener('change', () => onChange(num.value));

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↺';
    resetBtn.title = `Reset to ${defaults[row.key]}`;
    resetBtn.style.cssText = RESET_BTN;
    resetBtn.addEventListener('click', () => onChange(defaults[row.key]));
    wrap.appendChild(resetBtn);

    allOnChange.push({ key: row.key, onChange });
    return wrap;
  }

  SECTIONS.forEach(({ title, rows }) => {
    const sec = document.createElement('div');
    sec.style.cssText = 'margin-top:10px;border-top:1px solid rgba(0,255,255,.3);padding-top:8px';

    const secHeader = document.createElement('div');
    secHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px';

    const h = document.createElement('div');
    h.style.cssText = 'font-weight:bold';
    h.textContent = title;
    secHeader.appendChild(h);

    const secReset = document.createElement('button');
    secReset.textContent = '↺ Reset section';
    secReset.style.cssText = RESET_BTN;
    secReset.addEventListener('click', () => {
      rows.forEach((r) => {
        state[r.key] = defaults[r.key];
      });
      allOnChange
        .filter(({ key }) => rows.some((r) => r.key === key))
        .forEach(({ key, onChange }) => onChange(defaults[key]));
    });
    secHeader.appendChild(secReset);
    sec.appendChild(secHeader);

    rows.forEach((r) => sec.appendChild(makeRow(r)));
    panel.appendChild(sec);
  });

  if (setPhysicsDebugVisible) {
    let debugOn = true;
    const toggleDebugBtn = document.createElement('button');
    toggleDebugBtn.textContent = 'Hide Colliders + Floor';
    toggleDebugBtn.style.cssText = 'margin-top:8px;width:100%;padding:5px;background:#ff2222;color:#fff;border:none;border-radius:3px;cursor:pointer;font:bold 11px \'Courier New\'';
    toggleDebugBtn.addEventListener('click', () => {
      debugOn = !debugOn;
      setPhysicsDebugVisible(debugOn);
      toggleDebugBtn.textContent = debugOn ? 'Hide Colliders + Floor' : 'Show Colliders + Floor';
      toggleDebugBtn.style.background = debugOn ? '#ff2222' : '#444';
    });
    panel.appendChild(toggleDebugBtn);
  }

  const teleportBtn = document.createElement('button');
  teleportBtn.textContent = 'Teleport Ball to Spawn';
  teleportBtn.style.cssText = 'margin-top:8px;width:100%;padding:5px;background:#0ff;color:#000;border:none;border-radius:3px;cursor:pointer;font:bold 11px \'Courier New\'';
  teleportBtn.addEventListener('click', () => {
    if (!ballBody?.rb) return;
    ballBody.rb.setBodyType(2, true);
    ballBody.rb.setTranslation({ x: state.spawnX, y: state.spawnY, z: state.spawnZ }, true);
    ballBody.rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ballBody.rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    ballBody.userData.launched = false;
    teleportBtn.textContent = '✓ Done';
    setTimeout(() => { teleportBtn.textContent = 'Teleport Ball to Spawn'; }, 1500);
  });
  panel.appendChild(teleportBtn);

  const sep = document.createElement('div');
  sep.style.cssText = 'margin-top:10px;border-top:1px solid rgba(0,255,255,.3);padding-top:8px;display:flex;gap:8px';

  const resetAllBtn = document.createElement('button');
  resetAllBtn.textContent = '↺ Reset All';
  resetAllBtn.style.cssText = 'flex:1;padding:6px;background:transparent;color:#0ff;border:1px solid #0ff;border-radius:3px;cursor:pointer;font:bold 11px \'Courier New\'';
  resetAllBtn.addEventListener('click', () => {
    allOnChange.forEach(({ key, onChange }) => onChange(defaults[key]));
    resetAllBtn.textContent = '✓ Reset!';
    setTimeout(() => { resetAllBtn.textContent = '↺ Reset All'; }, 1500);
  });
  sep.appendChild(resetAllBtn);

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy JSON';
  copyBtn.style.cssText = 'flex:1;padding:6px;background:#0ff;color:#000;border:none;border-radius:3px;cursor:pointer;font:bold 12px \'Courier New\'';
  copyBtn.addEventListener('click', () => {
    const json = {
      flippers: {
        FLIPPER_PIVOT_X:    state.pivotX,
        FLIPPER_OFFSET_X:   state.offsetX,
        FLIPPER_PIVOT_Y:    state.pivotY,
        FLIPPER_PIVOT_Z:    state.pivotZ,
        FLIPPER_REST_ANGLE: state.restAngle,
        FLIPPER_ROT_X:      state.flipperRotX * DEG,
        FLIPPER_ROT_Z:      state.flipperRotZ * DEG,
      },
      ball: {
        PLUNGER_SPAWN_X: state.spawnX,
        PLUNGER_SPAWN_Z: state.spawnZ,
      },
      gravity: {
        gravityTiltDeg:   state.gravityTilt,
        gravityMagnitude: state.gravityMag,
      },
      frame9_16: {
        frameMinX:   state.frameMinX,
        frameMaxX:   state.frameMaxX,
        frameMinZ:   state.frameMinZ,
        frameMaxZ:   state.frameMaxZ,
        frameMargin: state.frameMargin,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy JSON'; }, 2000);
  });
  sep.appendChild(copyBtn);
  panel.appendChild(sep);
  document.body.appendChild(panel);

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'PFD';
  toggleBtn.title = 'Playfield Debug';
  toggleBtn.style.cssText = 'position:fixed;top:10px;right:172px;padding:4px 8px;background:#0ff;color:#000;border:none;border-radius:3px;font:bold 11px \'Courier New\';cursor:pointer;z-index:10001';
  let visible = false;
  toggleBtn.addEventListener('click', () => {
    visible = !visible;
    panel.style.display = visible ? 'block' : 'none';
    toggleBtn.textContent = visible ? '✕' : 'PFD';
  });
  document.body.appendChild(toggleBtn);
}
