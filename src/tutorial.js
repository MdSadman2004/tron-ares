/**
 * GRID PROTOCOL — PLAYBACK TUTORIAL
 *
 * Temple-Run-style: the machine demonstrates first, then waits for the player
 * to do the thing it just showed, one control at a time. Runs once on a fresh
 * install (or with ?tutorial=1), then remembers.
 */

const STEPS = [
  {
    id: 'intro',
    text: 'THE MACHINE FLIES ITSELF — WATCH',
    hint: 'TouchDrive is on. You point, it drives.',
    auto: 4200
  },
  {
    id: 'steer',
    text: 'STEER — push the stick, or A / D',
    hint: 'Grab the controls: the pilot yields instantly.',
    wait: (g) => g.inputs.left || g.inputs.right,
    highlight: ['#tc-stick']
  },
  {
    id: 'lane',
    text: 'CHANGE LANE — ◀ LANE / LANE ▶',
    hint: 'On keyboard: V hands over to you completely.',
    wait: (g) => g.autoDrive && (g.autoDrive.lastNudge > 0 || !g.autoDrive.enabled),
    highlight: ['#tc-laneL', '#tc-laneR']
  },
  {
    id: 'fire',
    text: 'FIRE — hold SPACE, or the FIRE button',
    hint: 'Aim assist is on; just shoot.',
    wait: (g) => g.inputs.fireFront,
    highlight: ['#tc-fire']
  },
  {
    id: 'beam',
    text: 'PARTICLE LAZER — press Z, or LAZER',
    hint: 'A sustained crimson beam that cuts through hulls.',
    wait: (g) => g.inputs.beamPrimary,
    highlight: ['#tc-beam']
  },
  {
    id: 'transform',
    text: 'MORPH — press F, or the MORPH chip',
    hint: 'The whole machine reconfigures in mid-air.',
    wait: (g) => g.vehicle.mode !== 'CYCLE' || g.vehicle.transform.active,
    highlight: ['.tc-tap[data-tap="transform"]']
  },
  {
    id: 'done',
    text: 'GRID PROTOCOL ONLINE — GOOD LUCK',
    hint: 'Every run from here counts toward your grid score.',
    auto: 3200
  }
];

const STYLE = `
#tut-panel {
  position: fixed; left: 50%; bottom: 78px; transform: translateX(-50%);
  z-index: 7000; max-width: min(680px, 82vw); padding: 12px 20px 14px;
  text-align: center; pointer-events: none;
  background: linear-gradient(180deg, rgba(12, 2, 18, 0.9), rgba(6, 1, 10, 0.78));
  border: 1px solid rgba(0, 240, 255, 0.5); border-radius: 8px;
  box-shadow: 0 0 26px rgba(0, 200, 255, 0.22);
  font-family: var(--font-mono, monospace); color: #dff6ff;
  transition: opacity 0.25s ease;
}
#tut-panel .tut-step { font-size: 15px; letter-spacing: 0.12em; color: #bff6ff; }
#tut-panel .tut-hint { margin-top: 4px; font-size: 11px; color: #8fb8c8; letter-spacing: 0.05em; }
#tut-panel .tut-dots { margin-top: 9px; display: flex; gap: 6px; justify-content: center; }
#tut-panel .tut-dot {
  width: 7px; height: 7px; border-radius: 999px;
  background: rgba(120, 200, 220, 0.25); border: 1px solid rgba(0, 240, 255, 0.4);
}
#tut-panel .tut-dot.on { background: #00f0ff; box-shadow: 0 0 8px rgba(0, 240, 255, 0.9); }
#tut-skip {
  position: fixed; right: 18px; bottom: 18px; z-index: 7001;
  pointer-events: auto; padding: 8px 16px; font: inherit; font-size: 11px;
  letter-spacing: 0.14em; color: #ffd8e0; cursor: pointer;
  background: rgba(255, 8, 56, 0.18); border: 1px solid rgba(255, 8, 56, 0.7);
  border-radius: 6px; font-family: var(--font-mono, monospace);
}
.tut-glow {
  animation: tutPulse 1.1s ease-in-out infinite !important;
  border-color: rgba(0, 240, 255, 0.95) !important;
}
@keyframes tutPulse {
  0%, 100% { box-shadow: 0 0 6px rgba(0, 240, 255, 0.5); }
  50% { box-shadow: 0 0 22px rgba(0, 240, 255, 0.95); }
}
`;

export function createTutorial(game) {
  const params = new URLSearchParams(location.search);
  if (params.get('tutorial') === '0') return { shouldRun: () => false, start() {}, active: false };

  const forced = params.get('tutorial') === '1';
  let done = false;
  try { done = localStorage.getItem('gp:tutorialDone') === '1'; } catch (e) { /* ignore */ }

  const shouldRun = () => forced || !done;

  let panel = null;
  let skipBtn = null;
  let raf = null;
  let stepTimer = 0;
  let index = 0;
  let active = false;
  let highlighted = [];

  function ensureDom() {
    if (panel) return;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    panel = document.createElement('div');
    panel.id = 'tut-panel';
    panel.innerHTML = '<div class="tut-step"></div><div class="tut-hint"></div>' +
      `<div class="tut-dots">${STEPS.map(() => '<div class="tut-dot"></div>').join('')}</div>`;
    document.body.appendChild(panel);

    skipBtn = document.createElement('button');
    skipBtn.id = 'tut-skip';
    skipBtn.textContent = 'SKIP TUTORIAL';
    skipBtn.addEventListener('click', () => finish());
    document.body.appendChild(skipBtn);
  }

  function clearHighlights() {
    for (const el of highlighted) el.classList.remove('tut-glow');
    highlighted = [];
  }

  function applyHighlight(selectors) {
    clearHighlights();
    if (!selectors) return;
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        el.classList.add('tut-glow');
        highlighted.push(el);
      }
    }
  }

  function render() {
    const step = STEPS[index];
    if (!step || !panel) return;
    panel.querySelector('.tut-step').textContent = step.text;
    panel.querySelector('.tut-hint').textContent = step.hint || '';
    const dots = panel.querySelectorAll('.tut-dot');
    dots.forEach((d, i) => d.classList.toggle('on', i <= index));
    applyHighlight(step.highlight);
  }

  function advance() {
    index++;
    stepTimer = 0;
    if (index >= STEPS.length) { finish(); return; }
    render();
  }

  function finish() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    clearHighlights();
    if (panel) panel.style.opacity = '0';
    if (skipBtn) skipBtn.style.display = 'none';
    setTimeout(() => {
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      if (skipBtn && skipBtn.parentNode) skipBtn.parentNode.removeChild(skipBtn);
      panel = null; skipBtn = null;
    }, 400);
    try { localStorage.setItem('gp:tutorialDone', '1'); } catch (e) { /* ignore */ }
    if (game.hud) game.hud.showAlert('◈ TUTORIAL COMPLETE — SCORE IS LIVE', false, 2600);
  }

  function loop(now) {
    if (!active) return;
    const dt = (now - (loop.last || now)) / 1000;
    loop.last = now;

    // A lesson cannot be cut short by a derezz: keep the pilot alive and, if
    // the run ends anyway, start a fresh one and carry on teaching.
    if (game.state === 'gameover') {
      try { game.startGame(); } catch (e) { /* ignore */ }
    } else if (game.state === 'playing' && game.gameStats) {
      game.gameStats.playerShield = Math.max(
        game.gameStats.playerShield, game.gameStats.maxShield * 0.8
      );
      if (game.vehicle) game.vehicle.invulnTimer = Math.max(game.vehicle.invulnTimer, 0.5);
    }

    const step = STEPS[index];
    if (step) {
      // the game demonstrates on its own until the player acts
      if (step.wait && step.wait(game)) { advance(); }
      else if (step.auto) {
        stepTimer += dt * 1000;
        if (stepTimer >= step.auto) advance();
      } else {
        stepTimer += dt * 1000;
        if (stepTimer > 14000) advance();      // never trap the player
      }
    }
    raf = requestAnimationFrame(loop);
  }

  return {
    get active() { return active; },
    shouldRun,
    start() {
      if (active || !shouldRun()) return;
      ensureDom();
      active = true;
      index = 0;
      stepTimer = 0;
      loop.last = 0;
      render();
      if (game.hud) game.hud.showAlert('◈ PLAYBACK TUTORIAL — FOLLOW THE PROMPTS', true, 3000);
      raf = requestAnimationFrame(loop);
    },
    skip: finish,
    reset() { try { localStorage.removeItem('gp:tutorialDone'); } catch (e) { /* ignore */ } }
  };
}
