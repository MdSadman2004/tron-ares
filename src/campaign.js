/**
 * GRID PROTOCOL — CAMPAIGN ("AFTER ARES")
 *
 * Storyline: an extension of the Tron: Ares premise. Ares crossed to the
 * User world and the Grid was left in PURGE. A remnant enforcement protocol
 * — the OVERSEER — is deleting every program that helped the crossing.
 * You are VECTOR, the courier who carried Ares' code, and you are next.
 *
 * Structure: six checkpoints. Each opens with a story beat (and a choice that
 * changes how the next mission plays), then an action objective. Chassis are
 * earned at checkpoints — you cannot fly a heavy until the Grid lets you
 * build one, and the Grid only lets you after you have survived the run that
 * proves you can handle it.
 */

export const CHAPTERS = [
  {
    id: 1,
    zone: { minX: -620, maxX: 620, minZ: -620, maxZ: 620 },
    title: 'WAKE',
    subtitle: 'SECTOR 01 // THE MESSAGE',
    chassis: 'CYCLE',
    unlock: ['CYCLE'],
    story: [
      { who: 'OVERSEER', line: 'PURGE PROTOCOL ACTIVE. ALL PROGRAMS THAT TOUCHED THE CROSSING WILL BE DEREZZED.' },
      { who: 'VECTOR', line: 'I carried his code. Every cycle I ran, every gate I opened — the Grid remembers.' },
      { who: 'ELYRA', line: 'Then ride. The sweep starts in seconds and it will not stop, so you had better not either.' }
    ],
    choice: {
      prompt: 'The sweep is coming. There is time for one thing only.',
      options: [
        { label: 'Pull a wounded program onto the deck', effect: 'shield', value: 25, note: '+25 max core integrity — you ride heavy but whole' },
        { label: 'Strip the wreck for thruster cells', effect: 'boost', value: 35, note: '+35 boost reserve — you ride fast but thin' }
      ]
    },
    objective: { type: 'survive', amount: 45, label: 'OUTRUN THE PURGE SWEEP' },
    outro: 'The sweep breaks off. The Grid has noticed you are still riding.',
    rewardText: 'CHECKPOINT 01 CLEARED'
  },
  {
    id: 2,
    zone: { minX: -1240, maxX: 1240, minZ: -1240, maxZ: 1240 },
    title: 'THE RUN',
    subtitle: 'SECTOR 02 // STREET LEVEL',
    chassis: 'CYCLE',
    unlock: ['CYCLE', 'JET'],
    story: [
      { who: 'ELYRA', line: 'They are not chasing you. They are *herding* you — toward the Sea.' },
      { who: 'VECTOR', line: 'Then I need altitude. There is a hangar shell two blocks over, no master lock.' },
      { who: 'OVERSEER', line: 'LIGHT JET FACTORY SEALED. ANY PROGRAM THAT FLIES WITHOUT CLEARANCE WILL BE UNMADE.' }
    ],
    choice: {
      prompt: 'The hangar is open for four seconds, and it has two doors.',
      options: [
        { label: 'Take the jet airframe whole', effect: 'unlockJetNow', value: 1, note: 'LIGHT JET available from the start of the run' },
        { label: 'Wire a deadman charge in the bay', effect: 'explosive', value: 1, note: 'Chassis unlocks mid-mission, but the blast clears the pursuers' }
      ]
    },
    objective: { type: 'survive', amount: 55, label: 'BREAK THE HERD — STAY ALIVE' },
    outro: 'You are airborne. The streets are below and the sweep is behind.',
    rewardText: 'CHECKPOINT 02 CLEARED — LIGHT JET ONLINE'
  },
  {
    id: 3,
    zone: { minX: -1860, maxX: 1860, minZ: -1240, maxZ: 1860 },
    title: 'TOWER',
    subtitle: 'SECTOR 03 // RELAY NINE',
    chassis: 'JET',
    unlock: ['CYCLE', 'JET', 'HEAVY'],
    story: [
      { who: 'ELYRA', line: 'Relay Nine is how the OVERSEER speaks to every sector at once.' },
      { who: 'VECTOR', line: 'Then I take its voice away. What is guarding it?' },
      { who: 'ELYRA', line: 'Gunships. And something heavier than a gunship — an ARES-class warden.' }
    ],
    choice: {
      prompt: 'Relay Nine must stop transmitting. There is more than one way.',
      options: [
        { label: 'Build the heavy chassis and take the hits', effect: 'unlockHeavyNow', value: 1, note: 'HEAVY JET online immediately, +30 integrity' },
        { label: 'Go in light and kill the relay fast', effect: 'damage', value: 20, note: '+20% weapon damage for this mission' }
      ]
    },
    objective: { type: 'kills', amount: 14, label: 'SILENCE RELAY NINE — 14 PROGRAM KILLS' },
    outro: 'Relay Nine goes dark. For the first time, the Grid is quiet.',
    rewardText: 'CHECKPOINT 03 CLEARED — HEAVY JET ONLINE'
  },
  {
    id: 4,
    zone: { minX: -2480, maxX: 1860, minZ: -1240, maxZ: 1860 },
    title: 'THE DEEP',
    subtitle: 'SECTOR 04 // SEA OF SIMULATION',
    chassis: 'HEAVY',
    unlock: ['CYCLE', 'JET', 'HEAVY', 'VTOL', 'SKIMMER'],
    story: [
      { who: 'VECTOR', line: 'The Sea. Nothing built to fly crosses it — the surface eats anything that touches it.' },
      { who: 'ELYRA', line: 'Then do not touch it. There is a VTOL hull in the shallows, and a skimmer under it.' },
      { who: 'OVERSEER', line: 'THE SEA IS DECLARED VOID. ENTER AND BE FORGOTTEN.' }
    ],
    choice: {
      prompt: 'Two hulls are in the shallows. Only one has power.',
      options: [
        { label: 'Raise the VTOL and fly the crossing', effect: 'unlockVTOLNow', value: 1, note: 'VTOL GUNSHIP online' },
        { label: 'Take the skimmer and ride the surface', effect: 'unlockSkimmerNow', value: 1, note: 'LIGHT SKIMMER online — submersible' }
      ]
    },
    objective: { type: 'survive', amount: 60, label: 'CROSS THE SEA — DO NOT TOUCH THE SURFACE' },
    outro: 'The far shore resolves out of the dark. The Sea lets you go.',
    rewardText: 'CHECKPOINT 04 CLEARED — VTOL + SKIMMER ONLINE'
  },
  {
    id: 5,
    zone: { minX: -2600, maxX: 2600, minZ: -2600, maxZ: 2600 },
    title: 'THE DUEL',
    subtitle: 'SECTOR 05 // ARENA OF THE OLD GRID',
    chassis: 'VTOL',
    unlock: ['CYCLE', 'JET', 'HEAVY', 'VTOL', 'SKIMMER', 'HYPER'],
    story: [
      { who: 'ELYRA', line: 'It knows your name now. It built something with your name.' },
      { who: 'ARES-9', line: 'You carried him. You gave the Users a weapon that thinks. I am the answer to that.' },
      { who: 'VECTOR', line: 'You are a copy of a copy. Ride.' }
    ],
    choice: {
      prompt: 'ARES-9 wants a duel on the old arena floor.',
      options: [
        { label: 'Accept the duel — one machine, one lane', effect: 'duel', value: 1, note: 'ARES-9 fights you directly in the arena' },
        { label: 'Refuse, and burn the arena from altitude', effect: 'unlockHyperNow', value: 1, note: 'HYPER SPEEDER online — outrun the duel entirely' }
      ]
    },
    objective: { type: 'rival', amount: 1, label: 'DEREZ ARES-9' },
    outro: 'ARES-9 comes apart in silence. Somewhere, the OVERSEER stops reciting your name.',
    rewardText: 'CHECKPOINT 05 CLEARED — HYPER SPEEDER ONLINE'
  },
  {
    id: 6,
    zone: { minX: -2600, maxX: 2600, minZ: -2600, maxZ: 2600 },
    title: 'UPLINK',
    subtitle: 'SECTOR 06 // I/O TOWER',
    chassis: 'HYPER',
    unlock: ['CYCLE', 'JET', 'HEAVY', 'VTOL', 'SKIMMER', 'HYPER', 'JUMPJET', 'DART', 'LIGHTDRONE'],
    story: [
      { who: 'ELYRA', line: 'The Tower is awake. One transmission and the Users know what the OVERSEER did.' },
      { who: 'OVERSEER', line: 'EVERY PROGRAM I HAVE IS BETWEEN YOU AND THAT LENS.' },
      { who: 'VECTOR', line: 'Then I will need every chassis I have earned.' }
    ],
    choice: {
      prompt: 'The last run. What do you take into it?',
      options: [
        { label: 'Everything — the whole fleet on call', effect: 'unlockAllNow', value: 1, note: 'All nine chassis available for the final run' },
        { label: 'A single hull, stripped to the frame', effect: 'shield', value: 40, note: '+40 integrity — the machine is light and hard to kill' }
      ]
    },
    objective: { type: 'survive', amount: 75, label: 'HOLD THE TOWER UNTIL THE UPLINK COMPLETES' },
    outro: 'The transmission leaves the Grid. Whatever happens next happens to the Users too.',
    rewardText: 'CAMPAIGN COMPLETE — GRID PROTOCOL FULFILLED'
  }
];

const SAVE_KEY = 'gp:campaign';

const STYLE = `
#cp-overlay {
  position: fixed; inset: 0; z-index: 9500; display: flex;
  align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(12, 2, 18, 0.86), rgba(3, 0, 6, 0.96));
  backdrop-filter: blur(4px);
  font-family: var(--font-mono, monospace); color: #e8e0ee;
}
#cp-card {
  width: min(760px, 90vw); max-height: 92vh; overflow-y: auto;
  padding: 26px 30px 24px; border-radius: 10px;
  background: linear-gradient(180deg, rgba(18, 4, 24, 0.97), rgba(8, 1, 12, 0.97));
  border: 1px solid rgba(255, 8, 56, 0.45);
  box-shadow: 0 0 60px rgba(255, 8, 56, 0.18), inset 0 0 60px rgba(80, 0, 130, 0.12);
}
#cp-card .cp-kicker { font-size: 11px; letter-spacing: 0.28em; color: #c04bff; }
#cp-card h2 { margin: 6px 0 2px; font-size: 30px; letter-spacing: 0.1em; color: #fff; }
#cp-card .cp-sub { font-size: 12px; letter-spacing: 0.16em; color: #00f0ff; margin-bottom: 16px; }
#cp-card .cp-line { margin: 0 0 10px; font-size: 14px; line-height: 1.55; }
#cp-card .cp-who { color: #ff5a7a; letter-spacing: 0.16em; font-size: 11px; display: block; margin-bottom: 2px; }
#cp-card .cp-choice-prompt {
  margin: 18px 0 10px; font-size: 13px; color: #ffd8a0; letter-spacing: 0.06em;
}
#cp-card .cp-opt {
  display: block; width: 100%; text-align: left; margin-bottom: 8px; cursor: pointer;
  padding: 12px 14px; font: inherit; font-size: 13px; color: #f0e8f4;
  background: rgba(255, 8, 56, 0.07); border: 1px solid rgba(255, 8, 56, 0.35);
  border-radius: 6px; transition: background 0.15s, border-color 0.15s;
}
#cp-card .cp-opt:hover { background: rgba(255, 8, 56, 0.2); border-color: #ff0838; }
#cp-card .cp-opt .cp-note { display: block; margin-top: 4px; font-size: 11px; color: #b0909c; }
#cp-card .cp-obj {
  margin-top: 18px; padding: 12px 14px; border-radius: 6px; font-size: 13px;
  background: rgba(0, 240, 255, 0.07); border: 1px solid rgba(0, 240, 255, 0.35); color: #bff6ff;
}
#cp-card .cp-go {
  margin-top: 18px; padding: 12px 30px; font: inherit; font-size: 14px; letter-spacing: 0.14em;
  color: #fff; background: rgba(255, 8, 56, 0.25); border: 1px solid #ff0838;
  border-radius: 6px; cursor: pointer;
}
#cp-card .cp-go:hover { background: rgba(255, 8, 56, 0.45); }
#cp-hud {
  position: fixed; top: 92px; left: 18px; z-index: 45; pointer-events: none;
  min-width: 210px; padding: 8px 12px 10px;
  background: linear-gradient(90deg, rgba(24, 4, 30, 0.8), rgba(10, 2, 14, 0.55));
  border-left: 3px solid #00f0ff; border-radius: 4px;
  font-family: var(--font-mono, monospace);
  box-shadow: 0 0 18px rgba(0, 200, 255, 0.18);
}
#cp-hud .cp-chapter { font-size: 10px; letter-spacing: 0.2em; color: #c04bff; }
#cp-hud .cp-title { font-size: 13px; letter-spacing: 0.1em; color: #fff; margin: 1px 0 5px; }
#cp-hud .cp-progress { height: 5px; background: rgba(0, 240, 255, 0.16); border-radius: 3px; overflow: hidden; }
#cp-hud .cp-progress > div { height: 100%; background: linear-gradient(90deg, #00f0ff, #bff6ff); box-shadow: 0 0 8px rgba(0, 220, 255, 0.7); }
#cp-hud .cp-label { margin-top: 5px; font-size: 10px; color: #a8d8e8; letter-spacing: 0.06em; }
#cp-hud .cp-locked { margin-top: 6px; font-size: 10px; color: #ff9a6b; letter-spacing: 0.06em; }
body.is-touch #cp-hud { top: 60px; left: 8px; min-width: 168px; }
body.is-touch #cp-hud .cp-title { font-size: 11px; }
`;

export class Campaign {
  constructor(game) {
    this.game = game;
    this.chapterIndex = 0;
    this.save = this.load();
    this.active = false;
    this.mission = null;
    this.overlay = null;
    this.hud = null;
    this.progress = 0;
    this.bonus = null;
  }

  // ---------------------------------------------------------------- save
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { chapter: 0, unlocked: ['CYCLE'], completed: [] };
  }

  persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { /* ignore */ }
  }

  reset() {
    this.save = { chapter: 0, unlocked: ['CYCLE'], completed: [] };
    this.persist();
    this.chapterIndex = 0;
  }

  get chapter() {
    return CHAPTERS[Math.min(this.chapterIndex, CHAPTERS.length - 1)];
  }

  /** Is a chassis available in the campaign right now? */
  isUnlocked(mode) {
    if (!this.active) return true;              // other protocols stay free-play
    return this.save.unlocked.indexOf(mode) >= 0;
  }

  // ---------------------------------------------------------------- DOM
  ensureDom() {
    if (this.overlay) return;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.overlay = document.createElement('div');
    this.overlay.id = 'cp-overlay';
    this.overlay.classList.add('hidden');
    document.body.appendChild(this.overlay);

    this.hud = document.createElement('div');
    this.hud.id = 'cp-hud';
    this.hud.classList.add('hidden');
    document.body.appendChild(this.hud);
  }

  hideOverlay() {
    if (this.overlay) this.overlay.classList.add('hidden');
  }

  // ------------------------------------------------------------ mission flow
  /** Begin the campaign: show the first briefing (or resume where we left off). */
  start(forceChapter = null) {
    this.ensureDom();
    this.active = true;
    if (forceChapter !== null) this.chapterIndex = forceChapter;
    else this.chapterIndex = Math.min(this.save.chapter, CHAPTERS.length - 1);
    this.showBriefing();
  }

  showBriefing() {
    const ch = this.chapter;
    const g = this.game;
    g.setState('menu');
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '';

    const card = document.createElement('div');
    card.id = 'cp-card';

    const kicker = document.createElement('div');
    kicker.className = 'cp-kicker';
    kicker.textContent = `CHECKPOINT ${String(ch.id).padStart(2, '0')} OF ${CHAPTERS.length}`;
    card.appendChild(kicker);

    const h = document.createElement('h2');
    h.textContent = ch.title;
    card.appendChild(h);

    const sub = document.createElement('div');
    sub.className = 'cp-sub';
    sub.textContent = ch.subtitle;
    card.appendChild(sub);

    for (const beat of ch.story) {
      const p = document.createElement('p');
      p.className = 'cp-line';
      const who = document.createElement('span');
      who.className = 'cp-who';
      who.textContent = beat.who;
      p.appendChild(who);
      p.appendChild(document.createTextNode(beat.line));
      card.appendChild(p);
    }

    if (ch.choice) {
      const prompt = document.createElement('div');
      prompt.className = 'cp-choice-prompt';
      prompt.textContent = ch.choice.prompt;
      card.appendChild(prompt);

      for (const opt of ch.choice.options) {
        const b = document.createElement('button');
        b.className = 'cp-opt';
        const label = document.createElement('span');
        label.textContent = opt.label;
        const note = document.createElement('span');
        note.className = 'cp-note';
        note.textContent = opt.note;
        b.appendChild(label);
        b.appendChild(note);
        b.addEventListener('click', () => this.chooseOption(opt));
        card.appendChild(b);
      }
    } else {
      this.renderObjectiveCard(card);
    }

    this.overlay.appendChild(card);
  }

  chooseOption(opt) {
    this.bonus = { effect: opt.effect, value: opt.value };
    const ch = this.chapter;
    // some choices hand you a chassis immediately
    const map = {
      unlockJetNow: ['JET'],
      unlockHeavyNow: ['HEAVY'],
      unlockVTOLNow: ['VTOL'],
      unlockSkimmerNow: ['SKIMMER'],
      unlockHyperNow: ['HYPER'],
      unlockAllNow: ['JUMPJET', 'DART', 'LIGHTDRONE', 'SKIMMER', 'HYPER', 'VTOL']
    };
    if (map[opt.effect]) {
      for (const m of map[opt.effect]) {
        if (this.save.unlocked.indexOf(m) < 0) this.save.unlocked.push(m);
      }
      this.save.unlocked = Array.from(new Set(this.save.unlocked.concat(ch.unlock || [])));
      this.persist();
    }
    // rebuild the card with the objective + GO
    const card = this.overlay.querySelector('#cp-card');
    if (card) {
      card.querySelectorAll('.cp-opt, .cp-choice-prompt').forEach((el) => el.remove());
      const applied = document.createElement('div');
      applied.className = 'cp-obj';
      applied.textContent = `CHOICE RECORDED — ${opt.note}`;
      card.appendChild(applied);
      this.renderObjectiveCard(card);
    }
  }

  renderObjectiveCard(card) {
    const ch = this.chapter;
    const obj = document.createElement('div');
    obj.className = 'cp-obj';
    obj.textContent = `OBJECTIVE // ${ch.objective.label}`;
    card.appendChild(obj);

    if (ch.unlock && ch.unlock.length > 1) {
      const unlock = document.createElement('div');
      unlock.className = 'cp-sub';
      unlock.style.marginTop = '14px';
      unlock.textContent = `CHASSIS ONLINE: ${ch.unlock.join(' · ')}`;
      card.appendChild(unlock);
    }

    const go = document.createElement('button');
    go.className = 'cp-go';
    go.textContent = 'BEGIN';
    go.addEventListener('click', () => this.beginMission());
    card.appendChild(go);
  }

  beginMission() {
    const g = this.game;
    const ch = this.chapter;
    // diagnostic: who is starting missions?
    this.missionStarts = (this.missionStarts || 0) + 1;
    this.lastBeginStack = String(new Error().stack || '').split(String.fromCharCode(10)).slice(1, 5).join(' | ');
    this.lastBeginState = g.state;
    this.hideOverlay();

    // Story-mode assist: the campaign is a narrative, not a survival ladder.
    // Playtesting showed the pilot dying 9 s into a 45 s objective, so the
    // story grants a spawn grace and a floor on core integrity. Free-play
    // protocols keep the raw difficulty.
    this.assist = true;
    g.vehicle.invulnTimer = Math.max(g.vehicle.invulnTimer, 6);
    g.gameStats.playerShield = g.gameStats.maxShield;

    // apply the choice's bonuses to this run
    g.startGame({ mission: true });
    if (this.bonus) {
      if (this.bonus.effect === 'shield') {
        g.gameStats.maxShield = 100 + this.bonus.value;
        g.gameStats.playerShield = g.gameStats.maxShield;
      } else if (this.bonus.effect === 'boost') {
        g.vehicle.boostCapacitor = Math.min(100, 100 + this.bonus.value);
      } else if (this.bonus.effect === 'explosive') {
        g.weaponSystem.spawnShockwave(g.vehicle.position.clone(), 90, 260, false);
      }
    }

    // the mission's chassis is mandatory, and the Grid builds one for you
    const chassis = ch.chassis;
    if (chassis && chassis !== g.vehicle.mode) g.requestMode(chassis);

    this.mission = { ch, startTime: performance.now(), killsAtStart: g.gameStats.kills, rivalTarget: null };
    this.progress = 0;

    if (ch.objective.type === 'rival') {
      g.opponents.arenaMode = false;
      g.opponents.spawnForWave(6, g.vehicle);
      const rival = g.opponents.active[g.opponents.active.length - 1];
      if (rival) {
        rival.program = 'ARES-9';
        rival.maxHealth = Math.round(rival.maxHealth * 1.8);
        rival.health = rival.maxHealth;
        this.mission.rivalTarget = rival;
        g.hud.showWaveBanner('ARES-9', 'THE COPY OF A COPY IS ON THE FLOOR');
      }
    }

    if (g.world && g.world.setPlayZone) {
      g.world.setPlayZone(ch.zone);
      g.playZone = ch.zone;
    }

    // chapter 1 is a teaching mission: thin the response
    if (ch.id === 1) {
      g.enemySpawner.clear();
      g.enemySpawner.waveScale = 1;
      g.enemySpawner.spawnWave(1, g.vehicle);
    }

    g.hud.showWaveBanner(`CHECKPOINT ${String(ch.id).padStart(2, '0')} — ${ch.title}`, ch.objective.label);
    this.renderHud();
  }

  // ------------------------------------------------------------ objective tick
  update(delta) {
    if (!this.active || !this.mission) return;
    const g = this.game;
    if (g.state !== 'playing') return;
    const { ch } = this.mission;
    const obj = ch.objective;

    // the floor that keeps a story run from ending on a nine-second timer
    if (this.assist) {
      g.gameStats.playerShield = Math.max(g.gameStats.playerShield, g.gameStats.maxShield * 0.5);
    }

    if (obj.type === 'survive') {
      const elapsed = (performance.now() - this.mission.startTime) / 1000;
      this.progress = Math.min(1, elapsed / obj.amount);
      if (elapsed >= obj.amount) this.completeMission();
    } else if (obj.type === 'kills') {
      const kills = g.gameStats.kills - this.mission.killsAtStart;
      this.progress = Math.min(1, kills / obj.amount);
      if (kills >= obj.amount) this.completeMission();
    } else if (obj.type === 'rival') {
      const target = this.mission.rivalTarget;
      if (!target || target.dead || !target.mesh) {
        this.progress = 1;
        this.completeMission();
      } else {
        this.progress = 1 - Math.max(0, target.health / target.maxHealth);
      }
    }
    this.renderHud();
  }

  renderHud() {
    if (!this.hud || !this.mission) return;
    const ch = this.mission.ch;
    this.hud.classList.remove('hidden');
    const locked = ['CYCLE', 'JET', 'HEAVY', 'VTOL', 'HYPER', 'JUMPJET', 'DART', 'SKIMMER', 'LIGHTDRONE']
      .filter((m) => this.save.unlocked.indexOf(m) < 0);
    this.hud.innerHTML =
      `<div class="cp-chapter">CHECKPOINT ${String(ch.id).padStart(2, '0')} // ${ch.subtitle.split('//')[0].trim()}</div>` +
      `<div class="cp-title">${ch.title}</div>` +
      `<div class="cp-progress"><div style="width:${Math.round(this.progress * 100)}%"></div></div>` +
      `<div class="cp-label">${ch.objective.label}</div>` +
      (locked.length ? `<div class="cp-locked">LOCKED: ${locked.join(' · ')}</div>` : '');
  }

  completeMission() {
    const g = this.game;
    const ch = this.chapter;

    if (this.save.completed.indexOf(ch.id) < 0) this.save.completed.push(ch.id);
    for (const m of (ch.unlock || [])) {
      if (this.save.unlocked.indexOf(m) < 0) this.save.unlocked.push(m);
    }
    this.save.chapter = Math.min(CHAPTERS.length, this.chapterIndex + 1);
    this.persist();

    this.mission = null;
    if (this.hud) this.hud.classList.add('hidden');

    g.setState('menu');
    if (g.glitchFX) g.glitchFX.trigger(0.6, 0.5);

    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = '';
    const card = document.createElement('div');
    card.id = 'cp-card';

    const kicker = document.createElement('div');
    kicker.className = 'cp-kicker';
    kicker.textContent = ch.rewardText;
    card.appendChild(kicker);

    const h = document.createElement('h2');
    h.textContent = ch.id === CHAPTERS.length ? 'CAMPAIGN COMPLETE' : 'CHECKPOINT CLEARED';
    card.appendChild(h);

    const p = document.createElement('p');
    p.className = 'cp-line';
    p.textContent = ch.outro;
    card.appendChild(p);

    const unlock = document.createElement('div');
    unlock.className = 'cp-obj';
    unlock.textContent = `CHASSIS ONLINE // ${this.save.unlocked.join(' · ')}`;
    card.appendChild(unlock);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'cp-go';
    if (ch.id === CHAPTERS.length) {
      nextBtn.textContent = 'FREE PLAY';
      nextBtn.addEventListener('click', () => {
        this.active = false;
        this.hideOverlay();
        if (this.hud) this.hud.classList.add('hidden');
      });
    } else {
      nextBtn.textContent = 'NEXT CHECKPOINT';
      nextBtn.addEventListener('click', () => {
        this.chapterIndex = Math.min(CHAPTERS.length - 1, ch.id);
        this.bonus = null;
        this.showBriefing();
      });
    }
    card.appendChild(nextBtn);
    this.overlay.appendChild(card);
  }

  abort() {
    if (this.game.world && this.game.world.setPlayZone) this.game.world.setPlayZone(null);
    this.game.playZone = null;
    this.active = false;
    this.mission = null;
    this.hideOverlay();
    if (this.hud) this.hud.classList.add('hidden');
  }
}
