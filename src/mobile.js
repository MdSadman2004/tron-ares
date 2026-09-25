/**
 * TRON: ARES — TOUCH CONTROLS (Android / tablet)
 *
 * The game is driven entirely by keyboard state, so this layer dispatches
 * REAL key events rather than reaching into game internals: identical code
 * paths, identical behaviour, nothing to keep in sync.
 *
 * Layout (landscape):
 *   left  — virtual throttle/steer stick + climb/dive pads
 *   right — FIRE / BEAM / CUTTER / BOOST cluster
 *   top   — SPECIAL / TRANSFORM / CAMERA / PAUSE
 *
 * Enable: automatically on a touch device, or force with ?touch=1 (and
 * ?touch=0 disables it).
 */

const TOUCH_DEVICE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (TOUCH_DEVICE) {
  // Read by the HUD/renderer to skip desktop-only costs before init runs.
  window.__TRON_PHONE__ = true;
}

const KEYS = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  climb: 'ArrowUp',
  dive: 'ArrowDown',
  fire: 'Space',
  beam: 'KeyZ',
  cutter: 'KeyX',
  boost: 'ShiftLeft',
  special: 'KeyQ',
  transform: 'KeyF',
  camera: 'KeyC',
  pause: 'KeyP'
};

function press(code) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
}
function release(code) {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
}

const STYLE = `
body.is-touch #modal-screen .feature-highlights { display: none; }
body.is-touch #modal-screen .modal-card {
  max-height: 98vh; overflow-y: auto; padding-top: 8px; padding-bottom: 8px;
}
body.is-touch #modal-screen .modal-title { font-size: 30px; margin-bottom: 2px; }
body.is-touch #modal-screen .modal-subtitle { font-size: 11px; margin-bottom: 8px; }
body.is-touch #modal-screen .keybind-row { font-size: 10px; padding: 1px 0; }
body.is-touch #modal-screen .modal-button-row {
  position: sticky; bottom: 0; z-index: 5; padding: 6px 0 2px;
  background: linear-gradient(to top, rgba(5, 1, 10, 0.96), rgba(5, 1, 10, 0.72));
}
body.is-touch #modal-screen #btn-start-game { padding: 12px 30px; font-size: 16px; }
/* The CTA must never sit below the fold on a short landscape screen */
body.is-touch #modal-screen .modal-button-row {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: 12px; z-index: 60; width: auto; background: none; padding: 0;
}
body.is-touch #modal-screen .modal-card { padding-bottom: 120px; }
/* The pinned CTA must not sit on top of the footer text on a short screen */
body.is-touch #modal-screen .modal-footer-notes {
  flex-direction: column; align-items: center; gap: 3px;
  font-size: 9px; max-width: 100%; padding: 0 8px 6px;
  white-space: normal; overflow-wrap: anywhere; text-align: center;
}
body.is-touch #modal-screen .keybind-grid { font-size: 10px; }

#tc-layer.tc-off { display: none; }
.tc-hide { display: none !important; }
#tc-layer {
  position: fixed; inset: 0; z-index: 6000; pointer-events: none;
  touch-action: none; -webkit-user-select: none; user-select: none;
  font-family: var(--font-mono, 'Share Tech Mono', monospace);
}
#tc-layer .tc-pad, #tc-layer .tc-btn {
  position: absolute; pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; color: rgba(255, 235, 235, 0.92);
  background: rgba(10, 4, 6, 0.42);
  border: 2px solid rgba(255, 30, 70, 0.55);
  box-shadow: 0 0 14px rgba(255, 20, 60, 0.28), inset 0 0 12px rgba(255, 20, 60, 0.14);
  text-shadow: 0 0 8px rgba(255, 40, 80, 0.8);
  backdrop-filter: blur(2px);
  transition: transform 0.06s ease, background 0.06s ease, border-color 0.06s ease;
}
#tc-layer .tc-btn { font-size: 15px; letter-spacing: 0.06em; }
#tc-layer .tc-btn.active, #tc-layer .tc-pad.active {
  background: rgba(255, 30, 70, 0.42);
  border-color: rgba(255, 120, 150, 0.95);
  transform: scale(0.94);
}
#tc-stick {
  left: 22px; bottom: 22px; width: 148px; height: 148px;
  background: rgba(10, 4, 6, 0.34);
}
#tc-knob {
  position: absolute; left: 50%; top: 50%; width: 62px; height: 62px;
  margin: -31px 0 0 -31px; border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, rgba(255, 120, 150, 0.95), rgba(180, 10, 45, 0.75));
  border: 2px solid rgba(255, 60, 100, 0.9);
  box-shadow: 0 0 18px rgba(255, 30, 70, 0.55); pointer-events: none;
}
#tc-laneL { left: 186px; bottom: 190px; width: 74px; height: 46px; font-size: 11px; border-radius: 10px; }
#tc-laneR { left: 268px; bottom: 190px; width: 74px; height: 46px; font-size: 11px; border-radius: 10px; }
#tc-climb { left: 186px; bottom: 116px; width: 62px; height: 62px; font-size: 20px; }
#tc-dive  { left: 186px; bottom: 44px;  width: 62px; height: 62px; font-size: 20px; }
#tc-fire   { right: 26px; bottom: 28px;  width: 104px; height: 104px; font-size: 16px;
             border-color: rgba(255, 60, 100, 0.85); }
#tc-beam   { right: 138px; bottom: 104px; width: 84px; height: 84px; font-size: 13px; }
#tc-cutter { right: 138px; bottom: 22px;  width: 84px; height: 84px; font-size: 13px; }
#tc-boost  { right: 232px; bottom: 62px;  width: 78px; height: 78px; font-size: 13px; }
#tc-taprow {
  position: absolute; top: 12px; right: 12px; display: flex; gap: 8px;
  pointer-events: auto;
}
#tc-taprow .tc-tap {
  min-width: 52px; height: 40px; padding: 0 10px; font-size: 12px;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  background: rgba(10, 4, 6, 0.42); color: rgba(255, 235, 235, 0.92);
  border: 2px solid rgba(255, 30, 70, 0.5);
  text-shadow: 0 0 8px rgba(255, 40, 80, 0.8);
}
#tc-taprow .tc-tap:active { background: rgba(255, 30, 70, 0.42); }
#tc-taprow .tc-tap.on {
  background: rgba(0, 240, 255, 0.2); border-color: rgba(0, 240, 255, 0.8);
  color: #bff6ff; text-shadow: 0 0 8px rgba(0, 220, 255, 0.9);
}
#tc-hint {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
  font-size: 12px; color: rgba(255, 180, 190, 0.75); letter-spacing: 0.08em;
  background: rgba(8, 3, 5, 0.5); padding: 6px 14px; border-radius: 6px;
  border: 1px solid rgba(255, 30, 70, 0.3); opacity: 0; transition: opacity 0.4s;
}
`;

export function installTouchControls(game) {
  const params = new URLSearchParams(location.search);
  if (params.get('touch') === '0') return null;

  const forced = window.__TRON_TOUCH__ === true || params.get('touch') === '1';
  const touchCapable = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!forced && !touchCapable) return null;

  document.body.classList.add('is-touch');

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'tc-layer';
  layer.innerHTML = `
    <div id="tc-stick" class="tc-pad"><div id="tc-knob"></div></div>
    <div id="tc-laneL" class="tc-btn tc-lane">◀ LANE</div>
    <div id="tc-laneR" class="tc-btn tc-lane">LANE ▶</div>
    <div id="tc-climb" class="tc-btn">▲</div>
    <div id="tc-dive" class="tc-btn">▼</div>
    <div id="tc-fire" class="tc-btn">FIRE</div>
    <div id="tc-beam" class="tc-btn">LAZER</div>
    <div id="tc-cutter" class="tc-btn">CUTTER</div>
    <div id="tc-boost" class="tc-btn">BOOST</div>
    <div id="tc-taprow">
      <div class="tc-tap" data-tap="special">Q · SPEC</div>
      <div class="tc-tap" data-tap="transform">F · MORPH</div>
      <div class="tc-tap" data-tap="camera">C · CAM</div>
      <div class="tc-tap on" data-tap="drive">◈ DRIVE</div>
      <div class="tc-tap on" data-tap="aim">◈ AIM</div>
      <div class="tc-tap" data-tap="pause">II</div>
    </div>
    <div id="tc-hint">TOUCH CONTROLS ONLINE — LANDSCAPE RECOMMENDED</div>
  `;
  document.body.appendChild(layer);

  const $ = (id) => layer.querySelector(id);

  // ---------------------------------------------------------------- stick
  const stick = $('#tc-stick');
  const knob = $('#tc-knob');
  const held = new Set();          // key codes currently pressed by touch
  let stickPointer = null;
  let stickVec = { x: 0, y: 0 };

  function setKey(code, on) {
    if (on) {
      if (held.has(code)) return;
      held.add(code);
      press(code);
    } else {
      if (!held.has(code)) return;
      held.delete(code);
      release(code);
    }
  }

  // Auto-throttle: nobody wants to hold a stick forward for a whole run, so the
  // craft cruises by itself and the stick steers; pull down to brake.
  let autoThrottle = true;
  function applyAutoThrottle(brake) {
    if (autoThrottle) {
      setKey(KEYS.forward, !brake);
      setKey(KEYS.backward, brake);
    }
  }

  function applyStick(x, y) {
    const dead = 0.18;
    const fwd = -y;                        // screen up = throttle
    // finer near centre: shape the magnitude, keep the sign
    const shaped = Math.sign(x) * Math.pow(Math.abs(x), 1.35);
    if (autoThrottle) {
      applyAutoThrottle(fwd < -dead);
    } else {
      setKey(KEYS.forward, fwd > dead);
      setKey(KEYS.backward, fwd < -dead);
    }
    setKey(KEYS.left, shaped < -dead);
    setKey(KEYS.right, shaped > dead);
  }

  function buzz(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } }
  }

  function stickMove(e) {
    const r = stick.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    stickVec = { x: dx, y: dy };
    knob.style.transform = `translate(${dx * 42}px, ${dy * 42}px)`;
    applyStick(dx, dy);
  }

  stick.addEventListener('pointerdown', (e) => {
    stickPointer = e.pointerId;
    stick.classList.add('active');
    stick.setPointerCapture(e.pointerId);
    if (game.autoDrive) game.autoDrive.notifyManual();
    stickMove(e);
    e.preventDefault();
  });
  stick.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickPointer) return;
    if (Math.abs(e.clientX - stick.getBoundingClientRect().left - 74) > 26 && game.autoDrive) {
      game.autoDrive.notifyManual(0.9);
    }
    stickMove(e);
    e.preventDefault();
  });
  const stickEnd = (e) => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    stick.classList.remove('active');
    knob.style.transform = 'translate(0px, 0px)';
    stickVec = { x: 0, y: 0 };
    applyStick(0, 0);
  };
  stick.addEventListener('pointerup', stickEnd);
  stick.addEventListener('pointercancel', stickEnd);

  // ------------------------------------------------------------ hold pads
  const HOLD = {
    '#tc-fire': KEYS.fire,
    '#tc-beam': KEYS.beam,
    '#tc-cutter': KEYS.cutter,
    '#tc-boost': KEYS.boost,
    '#tc-climb': KEYS.climb,
    '#tc-dive': KEYS.dive
  };
  for (const [sel, code] of Object.entries(HOLD)) {
    const el = $(sel);
    if (!el) continue;
    el.addEventListener('pointerdown', (e) => {
      el.classList.add('active');
      el.setPointerCapture(e.pointerId);
      setKey(code, true);
      buzz(14);
      e.preventDefault();
    });
    const up = (e) => {
      el.classList.remove('active');
      setKey(code, false);
      e.preventDefault();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  // ------------------------------------------------------------ lane taps
  for (const [sel, dir] of [['#tc-laneL', -1], ['#tc-laneR', 1]]) {
    const el = $(sel);
    if (!el) continue;
    el.addEventListener('pointerdown', (e) => {
      el.classList.add('active');
      if (game.autoDrive) game.autoDrive.nudge(dir);
      buzz(12);
      setTimeout(() => el.classList.remove('active'), 130);
      e.preventDefault();
    });
  }

  // --------------------------------------------------------- one-shot taps
  layer.querySelectorAll('.tc-tap').forEach((el) => {
    el.addEventListener('pointerdown', (e) => {
      const act = el.dataset.tap;
      el.style.background = 'rgba(255, 30, 70, 0.42)';
      setTimeout(() => { el.style.background = ''; }, 120);
      if (act === 'drive') {
        const on = game.autoDrive ? game.autoDrive.setEnabled(!game.autoDrive.enabled) : false;
        el.classList.toggle('on', on);
        buzz(18);
      } else if (act === 'aim') {
        const on = game.autoDrive ? game.autoDrive.setAutoFire(!game.autoDrive.autoFire) : false;
        el.classList.toggle('on', on);
        buzz(18);
      } else if (act === 'auto') {
        autoThrottle = !autoThrottle;
        el.classList.toggle('on', autoThrottle);
        if (game && game.hud && game.hud.showAlert) {
          game.hud.showAlert(autoThrottle ? 'AUTO-THROTTLE ENGAGED' : 'MANUAL THROTTLE', false, 1400);
        }
        if (!autoThrottle) { setKey(KEYS.forward, false); setKey(KEYS.backward, false); }
        else { applyAutoThrottle(false); }
      } else if (act === 'pause') {
        if (game && game.togglePause) game.togglePause();
      } else if (KEYS[act]) {
        press(KEYS[act]);
        setTimeout(() => release(KEYS[act]), 70);
      }
      e.preventDefault();
    });
  });

  // ------------------------------------------------------------ housekeeping
  // Kill browser gestures that would fight the game
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#tc-layer')) e.preventDefault();
  });

  window.addEventListener('blur', () => {
    for (const code of Array.from(held)) setKey(code, false);
    stickVec = { x: 0, y: 0 };
  });

  // Panels built for a desktop canvas collide with thumbs: measure what
  // actually overlaps the pads and retire those panels on phones.
  setTimeout(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const hud = document.getElementById('hud-overlay') || document.body;
    hud.querySelectorAll('*').forEach((el) => {
      if (el.closest('#tc-layer') || el.id === 'tc-layer') return;
      // Never touch the modal screens: they are the start / pause / game-over UI.
      if (el.closest('#modal-screen, #pause-overlay, .modal-backdrop, .modal-card')) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      const area = r.width * r.height;
      const tall = r.height > 100;
      const inSideColumn = r.left < 250 || r.right > vw - 250;
      const lowEnough = r.bottom > vh * 0.5;
      if (area > 25000 && tall && inSideColumn && lowEnough) {
        el.classList.add('tc-hide');
      }
    });
  }, 1500);

  // Momentary hint so the player knows the layer is live
  const hint = $('#tc-hint');
  if (hint) {
    setTimeout(() => { hint.style.opacity = '1'; }, 600);
    setTimeout(() => { hint.style.opacity = '0'; }, 4200);
  }

  // Mobile render budget: phones are fill-rate bound, so start conservative
  // and let the game's adaptive governor raise it if frames are cheap.
  try {
    if (game && game.applyQuality && !/[?&]hq=1/.test(location.search)) {
      // Phones are fill-rate bound: start at the reduced-resolution tier and
      // let the governor climb back up if frames turn out cheap.
      game.applyQuality(2);
    }
  } catch (e) { /* non-fatal */ }

  // The control layer belongs to gameplay only: on the menu / pause / game-over
  // screens the native UI owns the taps.
  let lastState = null;
  const syncVisibility = () => {
    const playing = !!(game && game.state === 'playing');
    layer.classList.toggle('tc-off', !playing);
    if (!playing) {
      for (const code of Array.from(held)) setKey(code, false);
    }
    // Phones need a moment to locate the controls: spawn protection is 1.5 s
    // on desktop, which is not enough when your thumbs are still moving.
    if (playing && lastState !== 'playing') {
      try {
        applyAutoThrottle(false);
        if (game.vehicle) {
          game.vehicle.invulnTimer = Math.max(game.vehicle.invulnTimer, 10);
        }
        if (game.hud && game.hud.showAlert) {
          game.hud.showAlert('SPAWN PROTECTION 10s — FIND YOUR CONTROLS', true, 3200);
        }
      } catch (err) { /* non-fatal */ }
    }
    lastState = game ? game.state : null;
  };
  syncVisibility();
  setInterval(syncVisibility, 250);

  return { layer, held, syncVisibility };
}
