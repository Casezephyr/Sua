/* =====================================================================
   SUARA 8-BIT  —  musik & efek suara dibuat langsung oleh browser
   Tidak butuh file audio. Semua lagu di bawah adalah komposisi asli.

   Isi file ini:
     1. Pengaturan volume
     2. Lagu (bisa kamu ubah nadanya)
     3. Efek suara (SFX)
     4. Mesin suara (tidak perlu diubah)
   ===================================================================== */
'use strict';

/* =====================================================================
   1. PENGATURAN VOLUME (0 sampai 1)
   ===================================================================== */
const VOLUME_MASTER = 0.5;
const VOLUME_MUSIC  = 0.32;
const VOLUME_SFX    = 0.6;


/* =====================================================================
   2. LAGU
   Setiap baris = 1 birama berisi 16 ketukan kecil, dipisah spasi.
     C4, D#5, Bb3 ... = nada (huruf + oktaf)
     -               = nada sebelumnya ditahan
     .               = diam
   Drum: 16 huruf per birama.  k = kick, s = snare, h = hi-hat, . = diam
   ===================================================================== */
const SONGS = {

  // Layar judul: tenang tapi waspada (A minor)
  title: {
    bpm: 100, loop: true,
    lead: [
      'E5 - - - D5 - C5 - B4 - - - A4 - - -',
      'A4 - - - C5 - F5 - E5 - - - C5 - - -',
      'G4 - - - C5 - E5 - G5 - - - E5 - - -',
      'G#4 - - - B4 - E5 - D5 - - - B4 - - -',
    ],
    bass: [
      'A2 - - - - - - - E3 - - - - - - -',
      'F2 - - - - - - - C3 - - - - - - -',
      'C3 - - - - - - - G2 - - - - - - -',
      'E2 - - - - - - - B2 - - - - - - -',
    ],
    drums: [
      'h.......h.......',
      'h.......h.......',
      'h.......h.......',
      'h.......h...h.h.',
    ],
  },

  // Saat bermain: cepat, makin cepat tiap fase
  main: {
    bpm: 148, loop: true,
    lead: [
      'A4 - C5 - E5 - A5 - G5 - E5 - C5 - D5 -',
      'C5 - A4 - F4 - A4 - C5 - F5 - E5 - C5 -',
      'E5 - G5 - C6 - G5 - E5 - G5 - A5 - G5 -',
      'D5 - B4 - G4 - B4 - D5 - - - B4 - D5 -',
      'A5 - - - G5 - E5 - G5 - - - E5 - C5 -',
      'F5 - - - E5 - C5 - A4 - C5 - F5 - A5 -',
      'G5 - E5 - C5 - E5 - G5 - C6 - B5 - G5 -',
      'B5 - - - A5 - G5 - D5 - - - G5 - B4 -',
    ],
    bass: [
      'A2 - A3 - A2 - A3 - A2 - A3 - A2 - A3 -',
      'F2 - F3 - F2 - F3 - F2 - F3 - F2 - F3 -',
      'C3 - C4 - C3 - C4 - C3 - C4 - C3 - C4 -',
      'G2 - G3 - G2 - G3 - G2 - G3 - B2 - G3 -',
      'A2 - A3 - A2 - A3 - A2 - A3 - A2 - A3 -',
      'F2 - F3 - F2 - F3 - F2 - F3 - F2 - F3 -',
      'C3 - C4 - C3 - C4 - C3 - C4 - C3 - C4 -',
      'G2 - G3 - G2 - G3 - G2 - - - G2 - B2 -',
    ],
    drums: [
      'k.h.s.h.k.h.s.h.',
      'k.h.s.h.k.k.s.h.',
      'k.h.s.h.k.h.s.h.',
      'k.h.s.h.k.h.s.ss',
      'k.h.s.h.k.h.s.h.',
      'k.h.s.h.k.k.s.h.',
      'k.h.s.h.k.h.s.h.',
      'k.k.s.h.k.h.ssss',
    ],
    // Lapisan tambahan yang muncul di fase tinggi (arpeggio)
    arp: [
      'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5',
      'F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4',
      'C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5',
      'G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4',
    ],
  },

  // Tertangkap: jingle pendek lalu diam
  end: {
    bpm: 112, loop: false,
    lead: [
      'E5 - C5 - A4 - - - F4 - - - E4 - - -',
      'A4 - - - - - - - . . . . . . . .',
    ],
    bass: [
      'A2 - - - - - - - F2 - - - E2 - - -',
      'A2 - - - - - - - . . . . . . . .',
    ],
    drums: [
      'k.......k.......',
      'k...............',
    ],
  },
};


/* =====================================================================
   3. EFEK SUARA
   tone(bentuk, nada awal Hz, durasi detik, volume, nada akhir Hz, jeda)
   noise(durasi, volume, filter Hz, jeda)
   bentuk: 'square' (kotak), 'pulse' (kotak tipis), 'triangle', 'sawtooth'
   ===================================================================== */
const SFX = {
  start:     s => { s.tone('pulse', 523, .07, .5); s.tone('pulse', 784, .07, .5, 0, .07); s.tone('pulse', 1047, .12, .5, 0, .14); },
  pause:     s => { s.tone('square', 880, .06, .4); s.tone('square', 660, .08, .4, 0, .08); },
  select:    s => s.tone('pulse', 1320, .05, .4),
  switch:    s => s.tone('triangle', 300, .08, .5, 520),
  hangTick:  (s, p) => s.tone('pulse', 400 + p * 500, .04, .3),
  place:     s => [523, 659, 784, 1047].forEach((f, i) => s.tone('pulse', f, .08, .5, 0, i * .05)),
  throw:     s => s.tone('square', 900, .07, .25, 380),
  droneDown: s => { s.noise(.35, .5, 2000); s.tone('square', 700, .35, .35, 90); },
  stall:     s => { s.tone('triangle', 260, .12, .6, 620); s.tone('triangle', 620, .14, .6, 240, .12); },
  hit:       s => { s.tone('square', 520, .3, .45, 70); s.noise(.18, .4, 1200); },
  rip:       s => s.noise(.12, .35, 5000),
  warn:      s => { s.tone('square', 1250, .06, .3); s.tone('square', 1250, .06, .3, 0, .12); },
  jet:       s => s.noise(.5, .35, 900),
  cough:     s => { s.noise(.07, .4, 700); s.noise(.07, .35, 600, .13); },
  tired:     s => s.tone('triangle', 330, .25, .5, 180),
  phase:     s => [392, 523, 659, 784].forEach((f, i) => s.tone('pulse', f, i === 3 ? .3 : .09, .5, 0, i * .09)),
  megaphone: s => { s.tone('sawtooth', 220, .07, .18); s.tone('sawtooth', 220, .07, .18, 0, .1); },
  pickup:    s => { s.tone('pulse', 988, .06, .45); s.tone('pulse', 1319, .1, .45, 0, .06); },
  empty:     s => s.tone('square', 140, .06, .4, 90),
  buff:      s => [659, 784, 988, 1319, 1568].forEach((f, i) => s.tone('pulse', f, .07, .4, 0, i * .04)),
  info:      s => { s.tone('triangle', 880, .08, .5); s.tone('triangle', 660, .12, .5, 0, .09); },
  heli:      s => s.noise(.05, .12, 400),
  hurt:      s => s.tone('square', 110, .08, .25, 80),
  record:    s => [784, 988, 1175, 1568].forEach((f, i) => s.tone('pulse', f, .1, .45, 0, i * .08)),
};

// Jeda minimal (detik) antar SFX yang sama, supaya tidak berisik
const SFX_COOLDOWN = { rip: .15, throw: .08, hit: .3, cough: 1, hangTick: .05, hurt: .5, heli: .11 };


/* =====================================================================
   4. MESIN SUARA
   Dipakai dari game.js:
     Sound.unlock()            panggil saat pemain pertama kali menekan tombol
     Sound.music('main')       ganti lagu ('title', 'main', 'end', atau null)
     Sound.sfx('place')        bunyikan efek
     Sound.intensity(fase, m)  lagu makin cepat & ramai
     Sound.duck(true/false)    kecilkan musik (saat jeda)
     Sound.toggleMute()        bisukan / nyalakan
   ===================================================================== */
const Sound = (() => {
  let ac = null, master, musicBus, sfxBus, pulseWave, noiseBuffer;
  let muted = false;
  try { muted = localStorage.getItem('spanduk-bisu') === '1'; } catch (e) {}

  // ---------- nada ----------
  const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteToHz(name) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(name);
    if (!m) return 0;
    const midi = 12 * (+m[3] + 1) + NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Ubah baris-baris lagu jadi daftar nada {langkah, Hz, panjang}
  function parseTrack(bars) {
    if (!bars) return { events: [], length: 0 };
    const tokens = bars.join(' ').trim().split(/\s+/);
    const events = [];
    tokens.forEach((tk, i) => {
      if (tk === '-' || tk === '.') return;
      let len = 1;
      while (tokens[i + len] === '-') len++;
      events.push({ step: i, hz: noteToHz(tk), len });
    });
    return { events, length: tokens.length };
  }
  function parseDrums(bars) {
    const chars = (bars || []).join('');
    return { hits: [...chars], length: chars.length };
  }

  const PARSED = {};
  for (const [name, song] of Object.entries(SONGS)) {
    PARSED[name] = {
      bpm: song.bpm, loop: song.loop,
      lead: parseTrack(song.lead), bass: parseTrack(song.bass),
      arp: parseTrack(song.arp), drums: parseDrums(song.drums),
    };
  }

  // ---------- pembangkit bunyi ----------
  function makePulseWave(duty) {
    const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return ac.createPeriodicWave(real, imag);
  }

  function tone(bus, type, hz, dur, vol, slideTo = 0, delay = 0) {
    if (!ac || !hz) return;
    const t = ac.currentTime + delay + (bus.scheduleAt || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    if (type === 'pulse') osc.setPeriodicWave(pulseWave); else osc.type = type;
    osc.frequency.setValueAtTime(hz, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(bus.node);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(bus, dur, vol, filterHz = 4000, delay = 0) {
    if (!ac) return;
    const t = ac.currentTime + delay + (bus.scheduleAt || 0);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuffer;
    f.type = filterHz > 3000 ? 'highpass' : 'lowpass';
    f.frequency.value = filterHz;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(bus.node);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // ---------- sequencer musik ----------
  let current = null, wanted = 'title', step = 0, nextTime = 0;
  let tempo = 1, arpOn = false, ducked = false;

  function playStep(song, i, at) {
    const bus = { node: musicBus, scheduleAt: at - ac.currentTime };
    const stepDur = 60 / (song.bpm * tempo) / 4;
    const hit = (track, type, vol) => {
      if (!track.length) return;
      const s = i % track.length;
      for (const e of track.events) if (e.step === s) tone(bus, type, e.hz, e.len * stepDur * 0.95, vol);
    };
    hit(song.lead, 'pulse', 0.22);
    hit(song.bass, 'triangle', 0.5);
    if (arpOn) hit(song.arp, 'square', 0.06);
    if (song.drums.length) {
      const d = song.drums.hits[i % song.drums.length];
      if (d === 'k') { tone(bus, 'square', 150, 0.09, 0.35, 45); }
      if (d === 's') { noise(bus, 0.1, 0.28, 1800); }
      if (d === 'h') { noise(bus, 0.03, 0.12, 7000); }
    }
  }

  function scheduler() {
    if (!ac || !current) return;
    const song = PARSED[current];
    const total = Math.max(song.lead.length, song.bass.length, song.drums.length);
    while (nextTime < ac.currentTime + 0.12) {
      if (!song.loop && step >= total) { current = null; return; }
      playStep(song, step, nextTime);
      nextTime += 60 / (song.bpm * tempo) / 4;
      step++;
    }
  }

  function startSong(name) {
    current = name;
    step = 0;
    if (ac) nextTime = ac.currentTime + 0.05;
  }

  // ---------- fungsi untuk game.js ----------
  const lastPlayed = {};

  return {
    unlock() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : VOLUME_MASTER;
      master.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = VOLUME_MUSIC; musicBus.connect(master);
      sfxBus = ac.createGain();   sfxBus.gain.value = VOLUME_SFX;     sfxBus.connect(master);
      pulseWave = makePulseWave(0.25);
      noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      setInterval(scheduler, 25);
      if (wanted) startSong(wanted);
    },

    music(name) {
      if (name === wanted && current === name) return;
      wanted = name;
      tempo = 1;
      arpOn = false;
      if (name) startSong(name); else current = null;
    },

    sfx(name, arg) {
      if (!ac || muted || !SFX[name]) return;
      const now = ac.currentTime, gap = SFX_COOLDOWN[name] || 0;
      if (lastPlayed[name] && now - lastPlayed[name] < gap) return;
      lastPlayed[name] = now;
      const bus = { node: sfxBus };
      SFX[name]({
        tone: (type, hz, dur, vol, slide = 0, delay = 0) => tone(bus, type, hz, dur, vol, slide, delay),
        noise: (dur, vol, f, delay = 0) => noise(bus, dur, vol, f, delay),
      }, arg);
    },

    // fase 0-5 & ketinggian (meter): lagu makin cepat, arpeggio muncul
    intensity(phase, meters) {
      tempo = 1 + phase * 0.05 + Math.min(0.25, meters / 1200);
      arpOn = phase >= 3;
    },

    duck(on) {
      ducked = on;
      if (musicBus) musicBus.gain.setTargetAtTime(on ? VOLUME_MUSIC * 0.25 : VOLUME_MUSIC, ac.currentTime, 0.05);
    },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('spanduk-bisu', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME_MASTER, ac.currentTime, 0.02);
      return muted;
    },

    get muted() { return muted; },
  };
})();
