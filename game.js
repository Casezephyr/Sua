/* =====================================================================
   SUA
   Isi file ini:
     1. Kanvas & ukuran layar
     2. Warna
     3. Memuat aset & fungsi gambar sprite
     4. Input (keyboard & tombol sentuh)
     5. Pengaturan game (teks, fase, angka-angka)
     6. Status game
     7. Logika game (update)
     8. Gambar pixel dasar
     9. Gambar dunia (latar, tiang, spanduk, karakter, musuh)
    10. HUD, title screen, layar akhir
    11. Loop utama
   Aset PNG diatur di aset.js, musik & suara di audio.js.
   ===================================================================== */
'use strict';

/* =====================================================================
   1. KANVAS & UKURAN LAYAR
   Tinggi dunia game selalu 288 piksel. Lebarnya menyesuaikan bentuk
   layar HP (160 sampai 240 piksel) supaya tidak ada sisi kosong.
   Kanvas aslinya 3x lebih besar supaya PNG beresolusi tinggi tetap tajam.
   ===================================================================== */
let W = 160;          // lebar dunia, berubah mengikuti layar
const MIN_W = 160;
const MAX_W = 240;
const H = 288;
const RES = 3;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W * RES;
canvas.height = H * RES;
ctx.imageSmoothingEnabled = !PIXEL_ART_ASSETS;
ctx.imageSmoothingQuality = 'high';

// Perbesar kanvas supaya pas di dalam bingkai layar (ikut ukuran HP)
const stage = document.getElementById('stage');
const BORDER = 3;   // tebal bingkai layar di style.css

function fitCanvas() {
  const areaW = stage.clientWidth - BORDER * 2, areaH = stage.clientHeight - BORDER * 2;
  if (areaW <= 0 || areaH <= 0) return;

  // lebar dunia mengikuti perbandingan layar (dibulatkan genap supaya tiang pas di tengah)
  const newW = Math.round(Math.min(MAX_W, Math.max(MIN_W, H * areaW / areaH)) / 2) * 2;
  if (newW !== W) {
    W = newW;
    PILLAR_X = W / 2;
    canvas.width = W * RES;
    ctx.imageSmoothingEnabled = !PIXEL_ART_ASSETS;
    ctx.imageSmoothingQuality = 'high';
  }

  // ukuran tampil & posisi di tengah bingkai
  const scale = Math.min(areaW / W, areaH / H);
  const w = Math.floor(W * scale), h = Math.floor(H * scale);
  const left = Math.floor((areaW - w) / 2), top = Math.floor((areaH - h) / 2);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.style.left = left + 'px';
  canvas.style.top = top + 'px';

  // lapisan warna hijau (SELECT) ikut menutupi isi layar
  document.querySelectorAll('.tint').forEach(t => {
    t.style.left = left + BORDER + 'px';
    t.style.top = top + BORDER + 'px';
    t.style.width = w + 'px';
    t.style.height = h + 'px';
  });
}
addEventListener('resize', fitCanvas);
new ResizeObserver(fitCanvas).observe(stage);

// Mode layar hijau ala dot-matrix (tombol SELECT), diingat browser
function setGreenScreen(on) {
  stage.classList.toggle('green', on);
  try { localStorage.setItem('spanduk-layar-hijau', on ? '1' : '0'); } catch (e) {}
}
try { setGreenScreen(localStorage.getItem('spanduk-layar-hijau') === '1'); } catch (e) {}


/* =====================================================================
   2. WARNA (palet ala Famicom)
   ===================================================================== */
const C = {
  white: '#fcfcfc', black: '#000000',
  yellow: '#f8d820', red: '#f83800', orange: '#fc7460', blue: '#0058f8',
  grass: '#b8f818', grassDark: '#00a800', trunk: '#a05010',
  path: '#f8d878', pathEdge: '#c84c0c',
  stone: '#f8d8a8', stoneDark: '#c88040',
  skin: '#f8c090', navy: '#000080', khaki: '#a05010', grey: '#7c7c7c',
  water: '#3cbcfc', waterDark: '#0078f8',
  pink: '#f8b8f8',
  // kota yang sudah hancur
  buildingFar: '#7c6c74', buildingFarWindow: '#5a4c54',
  buildingNear: '#3a3440', buildingNearWindow: '#24202a',
  fire: '#fc7460', fireBright: '#f8b800', crack: '#18141c', ash: '#9c8478',
  deadWood: '#5c3418', rust: '#6c3c2c',
  // satwa
  fur: '#c85a18', furDark: '#8c3c10', apeFace: '#e8a878',
  bear: '#1c1a1a', bearChest: '#f8d878', bearMuzzle: '#c8a060', beak: '#f8b800', casque: '#d82800',
  breath: '#58d854',
  forest: '#005800', forestDark: '#003000', burnt: '#503000',
  soil: '#a8642c', soilDark: '#784018', soilLight: '#d08850',
  pavement: '#c4c4c4', pavementDark: '#9c9c9c', asphalt: '#4c4c54', lane: '#fcfcfc',
  smoke: '#a8a8a8', smokeLight: '#d0d0d0',
};


/* =====================================================================
   3. MEMUAT ASET & FUNGSI GAMBAR SPRITE
   Semua fungsi sprite mengembalikan true kalau PNG-nya ada dan berhasil
   digambar. Kalau false, kode pemanggil menggambar versi pixel bawaan.
   ===================================================================== */
const IMAGES = {};   // nama aset -> gambar yang sudah dimuat

function loadAssets() {
  const jobs = Object.entries(ASSETS).map(([name, asset]) => new Promise(done => {
    if (!asset.file) return done();
    const img = new Image();
    img.onload = () => { IMAGES[name] = img; done(); };
    img.onerror = () => {
      console.warn(`Aset "${name}" tidak ditemukan: ${ASSET_FOLDER}${asset.file}`);
      done();
    };
    img.src = ASSET_FOLDER + asset.file;
  }));
  return Promise.all(jobs);
}

const hasAsset = name => !!IMAGES[name];
const frameCount = name => ASSETS[name].frames;

// Posisi piksel dibulatkan ke grid kanvas asli supaya tidak goyang
const snap = v => Math.round(v * RES) / RES;

// Potongan sumber untuk satu frame
function frameSource(name, frame) {
  const img = IMAGES[name], n = ASSETS[name].frames;
  const f = ((Math.floor(frame) % n) + n) % n;
  const fw = img.width / n;
  return { img, sx: f * fw, fw, fh: img.height };
}

// Gambar sprite dengan titik tumpu TENGAH-BAWAH (untuk karakter & benda)
function drawSprite(name, frame, centerX, bottomY, flip = false) {
  if (!hasAsset(name)) return false;
  const a = ASSETS[name], s = frameSource(name, frame);
  const x = snap(centerX - a.width / 2), y = snap(bottomY - a.height);
  if (flip) {
    ctx.save();
    ctx.translate(x + a.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(s.img, s.sx, 0, s.fw, s.fh, 0, 0, a.width, a.height);
    ctx.restore();
  } else {
    ctx.drawImage(s.img, s.sx, 0, s.fw, s.fh, x, y, a.width, a.height);
  }
  return true;
}

// Gambar sprite dari pojok KIRI-ATAS dengan ukuran bebas.
// cutX / cutY = bagian gambar yang dipakai (1 = penuh, 0.5 = setengah)
function drawSpriteBox(name, frame, x, y, w, h, cutX = 1, cutY = 1) {
  if (!hasAsset(name)) return false;
  const a = ASSETS[name], s = frameSource(name, frame);
  ctx.drawImage(s.img, s.sx, 0, Math.max(1, s.fw * cutX), Math.max(1, s.fh * cutY),
    snap(x), snap(y), snap(w ?? a.width), snap(h ?? a.height));
  return true;
}

// Ulang sprite ke samping dari x0 sampai x1 (untuk tanah, hutan, semprotan)
function drawSpriteRow(name, frame, y, x0 = 0, x1 = W) {
  if (!hasAsset(name)) return false;
  const a = ASSETS[name];
  for (let x = x0; x < x1; x += a.width) {
    const w = Math.min(a.width, x1 - x);
    drawSpriteBox(name, frame, x, y, w, a.height, w / a.width, 1);
  }
  return true;
}


/* =====================================================================
   4. INPUT
   keys[...]    = tombol sedang ditahan
   pressed[...] = tombol baru saja ditekan (sekali)
   ===================================================================== */
const keys = {};
const pressed = {};
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  z: 'a', Z: 'a', ' ': 'a',
  x: 'b', X: 'b',
  Enter: 'start', p: 'start', P: 'start',
  Shift: 'select',
};

function press(k)   { Sound.unlock(); if (!keys[k]) { pressed[k] = true; checkSecret(k); } keys[k] = true; }

// Easter egg: di title screen tekan ATAS ATAS BAWAH BAWAH KIRI KANAN KIRI KANAN B A
const SECRET_CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
let secretStep = 0;
let easterTimer = 0;
function checkSecret(k) {
  if (scene !== 'title') { secretStep = 0; return; }
  if (k === SECRET_CODE[secretStep]) {
    secretStep++;
    if (secretStep === SECRET_CODE.length) { secretStep = 0; easterTimer = 3.4; Sound.chant(); }
  } else {
    secretStep = k === SECRET_CODE[0] ? 1 : 0;
  }
}
function release(k) { keys[k] = false; }
function tapped(k)  { const v = pressed[k]; pressed[k] = false; return !!v; }

addEventListener('keydown', e => {
  if (donateOpen) { if (e.key === 'Escape') setDonate(false); return; }
  if (e.key === 'm' || e.key === 'M') { toggleSound(); return; }
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  press(k);
});
addEventListener('keyup', e => {
  const k = KEYMAP[e.key];
  if (k) release(k);
});

document.querySelectorAll('[data-key]').forEach(btn => {
  const k = btn.dataset.key;
  const down = e => { e.preventDefault(); press(k); btn.classList.add('on'); };
  const up   = e => { e.preventDefault(); release(k); btn.classList.remove('on'); };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('pointerleave', up);
});
canvas.addEventListener('pointerdown', () => { Sound.unlock(); if (scene === 'title') pressed.start = true; });

// Speaker di badan konsol = tombol bisukan suara
const speakerButton = document.getElementById('speaker');
function toggleSound() {
  Sound.unlock();
  speakerButton.setAttribute('aria-pressed', String(!Sound.toggleMute()));
}
speakerButton.setAttribute('aria-pressed', String(!Sound.muted));
speakerButton.addEventListener('click', toggleSound);

// Halaman donasi: game berhenti selama halaman ini terbuka
const donateButton = document.getElementById('donate-open');
const donatePanel = document.getElementById('donate-panel');
let donateOpen = false;
function setDonate(open) {
  donateOpen = open;
  donatePanel.hidden = !open;
  for (const k in keys) keys[k] = false;
  Sound.duck(open || !!(S && (S.paused || S.message)));
  if (open) donatePanel.querySelector('a, button').focus();
  else donateButton.focus();
}
donateButton.addEventListener('click', () => { Sound.unlock(); setDonate(true); });
document.getElementById('donate-close').addEventListener('click', () => setDonate(false));
donatePanel.addEventListener('click', e => { if (e.target === donatePanel) setDonate(false); });


/* =====================================================================
   5. PENGATURAN GAME
   Ubah angka & teks di sini untuk menyeimbangkan permainan.
   ===================================================================== */
// Nama game di title screen
const GAME_NAME = 'SUA';

// Dunia: y makin kecil = makin tinggi. Tanah di y = 0. Tiang tanpa ujung.
let PILLAR_X = W / 2;         // posisi tengah tiang (selalu di tengah layar)
const PILLAR_W = 14;          // lebar tiang
const START_Y = -50;          // posisi awal pemain
const MIN_BANNER_Y = -92;     // spanduk hanya boleh dipasang di atas ketinggian ini
const BANNER_W = 58;
const BANNER_H = 48;
const BANNER_GAP = 60;        // jarak minimal antar spanduk di sisi yang sama
const PX_PER_METER = 8;
const CAMERA_LOWEST = -(H - 60);

const CLIMB_SPEED = 40;       // kecepatan naik
const DROP_SPEED = 60;        // kecepatan turun
const HANG_TIME = 1.4;        // detik untuk memasang 1 spanduk
const POSTER_COOLDOWN = 0.3;  // jeda antar lemparan poster

// Poster = amunisi
const POSTER_START = 5;       // jumlah poster di awal
const POSTER_PER_BANNER = 1;  // bonus tiap pasang spanduk
const POSTER_PER_PICKUP = 2;  // bonus poster yang menempel di tiang
const POSTER_MAX = 30;
const PICKUP_GAP_MIN = 90;    // jarak antar poster di tiang (piksel)
const PICKUP_GAP_MAX = 170;
const POSTER_RANGE = 170;     // jarak bidik otomatis ke drone & skylift

// Asap & nafas
const SMOKE_DAMAGE = 14;      // nafas berkurang per detik di dalam asap
const BREATH_RECOVER = 3;     // nafas pulih per detik di luar asap
const INFO_DURATION = 12;     // lama kotak info tampil di bawah layar, lalu menutup sendiri (detik)
const INFO_GAP = 2;           // jeda minimal sebelum info berikutnya (detik)

// Gelembung dukungan masyarakat
const BUFF_TIME = 3;          // lama tenaga tak terbatas (detik)
const BUBBLE_GAP_MIN = 6;     // jeda munculnya gelembung (detik)
const BUBBLE_GAP_MAX = 10;
const SUPPORT_MESSAGES = [
  'ribuan warga ikut bersuara', 'netizen kirim semangat', 'warga bertepuk tangan',
  '#SelamatkanHutan trending', 'ibu-ibu kirim doa', 'mahasiswa ikut turun',
];

// Kotak info yang muncul di bawah layar setiap kali asap datang.
// Isinya bergantian: data ISPA akibat karhutla, lalu berita masalah lain di Indonesia.
// Data per 22 Oktober 2026; perbarui kalau ada berita baru.
const INFO_FEED = [
  { label: 'INFO ISPA', text: '174.694 kasus ISPA di daerah karhutla, Agustus-21 Sep 2026. 40.363 di antaranya balita.', source: 'Kemenkes RI' },
  { label: 'BERITA',    text: 'Tunjangan profesi guru honorer sempat macet 4 bulan, baru mulai cair bertahap Oktober 2026.', source: 'Komisi X DPR, Okt 2026' },
  { label: 'INFO ISPA', text: 'Kalimantan Barat mencatat 165.727 kasus ISPA, 1 Jan-22 Agu 2026.', source: 'Dinkes Kalbar' },
  { label: 'BERITA',    text: 'JPPI mencatat 43.838 korban keracunan program MBG di 36 provinsi sejak 2025.', source: 'JPPI, Sep 2026' },
  { label: 'INFO ISPA', text: 'Kasus ISPA di Kalimantan Tengah naik 39,2% dalam sepekan, 7-14 Agu 2026.', source: 'Dinkes Kalteng' },
  { label: 'BERITA',    text: '63.789 pekerja melaporkan kena PHK, Januari-September 2026. Jawa Barat terbanyak.', source: 'Kemnaker, Okt 2026' },
  { label: 'INFO ISPA', text: 'Asap karhutla sampai Malaysia: kasus ISPA di sana naik 124% dalam sepekan.', source: 'Kemenkes Malaysia, Agu 2026' },
  { label: 'BERITA',    text: 'Guru non-ASN di sekolah negeri hanya ditugaskan sampai 31 Des 2026. Skema setelahnya belum pasti.', source: 'SE Mendikdasmen 7/2026' },
  { label: 'INFO ISPA', text: '34.262 titik panas terpantau di Kalimantan, Januari-Juli 2026.', source: 'Walhi' },
  { label: 'BERITA',    text: '331 orang terdampak dugaan keracunan MBG di Kota Cirebon, 199 dirawat inap.', source: 'Dinkes Kota Cirebon, 22 Okt 2026' },
];

// Cara main: muncul setiap kali permainan dimulai
const HOW_TO_PLAY = {
  label: 'CARA MAIN',
  lines: [
    'ATAS / BAWAH : memanjat tiang',
    'KIRI / KANAN : pindah sisi tiang',
    'Tahan A : pasang spanduk',
    'Tahan B : lempar poster',
    'Jauhi asap, jaga NAFAS-mu',
  ],
  goal: 'TUJUAN: pasang spanduk sebanyak mungkin dan panjat setinggi mungkin!',
};

// Tips: muncul sekali saja (diingat browser) saat pertama kali bertemu
const TIPS = {
  lift:  { label: 'TIPS', lines: ['Skylift petugas datang dari bawah.', 'Tekan B untuk melempar poster ke keranjangnya. Petugas akan berhenti sejenak untuk membaca pesanmu.'] },
  drone: { label: 'TIPS', lines: ['Drone datang memotret dari dekat dan bisa membuatmu tergelincir.', 'Tekan B: poster akan menutupi kameranya.'] },
};

// Helikopter polisi yang sesekali lewat
const HELI_GAP_MIN = 14;      // detik
const HELI_GAP_MAX = 24;

// Makin tinggi makin susah
const DANGER_PER_METER = 0.06;   // skylift, drone, damkar, asap makin ganas tiap meter
const THIN_AIR_PER_METER = 0.02; // tenaga makin cepat habis saat memanjat
const MAX_THIN_AIR = 12;

const BANNER_TEXT = [
  ['BENCANA', 'MAKIN', 'PARAH'],
  ['HIDUP', 'MAKIN', 'SUSAH'],
  ['APA', 'KERJA', 'MEREKA?'],
  ['TANGANI', 'KRISIS', 'IKLIM'],
  ['HUTAN', 'KALTENG', 'TERBAKAR'],
  ['STOP', 'BAKAR', 'HUTAN'],
  ['DENGAR', 'KAMI!'],
];

// Fase naik kalau waktu (t, detik), jumlah spanduk (b), ATAU ketinggian (m, meter) tercapai
const PHASES = [
  { name: 'SATPAM PANIK',    t: 0,   b: 0, m: 0,    officer: 0, shouts: ['WADUH', 'SIAPA ITU?!', 'LAPOR!', 'KOK BISA?!', 'CCTV?!'] },
  { name: 'POLISI DATANG!',  t: 15,  b: 2, m: 20,   officer: 1, shouts: ['TURUN!', 'IZIN?!', 'AMANKAN!', 'TES URINE!', 'CABUT!'] },
  { name: 'KABUT ASAP!',     t: 35,  b: 4, m: 50,   officer: 1, shouts: ['ASAP!', 'UHUK!', 'MASKER!', 'GAK KELIATAN'] },
  { name: 'MERIAM AIR!',     t: 55,  b: 6, m: 90,   officer: 2, shouts: ['SEMPROT!', 'BASAHIN!', 'SELANG!', 'AIR!'] },
  { name: 'DRONE MELUNCUR!', t: 80,  b: 9, m: 140,  officer: 3, shouts: ['DRONE!', 'KEJAR!', 'FOTO DIA!', 'ZOOM!'] },
  { name: 'SIAGA PENUH!',    t: 115, b: 13, m: 200, officer: 3, shouts: ['SIAGA 1!', 'KEPUNG!', 'SEMUA UNIT!', 'LIFT 2!'] },
];
const PHASE = { POLICE: 1, SMOKE: 2, FIRE_DEPT: 3, DRONE: 4, FULL_ALERT: 5 };

const MEGAPHONE = ['SEGERA TURUN!', 'TIDAK BERIZIN!', 'BERBAHAYA!', 'KAMI BUJUK...', 'ADA LISTRIK!', 'TURUN BAIK2!'];

// Penanda ketinggian di langit [meter, label]
const HEIGHT_MARKERS = [
  [17, '17M PATUNG ASLI'], [132, '132M MONAS'], [383, '383M AUTOGRAPH'],
  [828, '828M BURJ KHALIFA'], [8849, '8849M EVEREST'],
];

// Jenis petugas: warna bawaan + nama aset PNG-nya
const OFFICERS = [
  { shirt: C.white, hat: C.navy,   asset: 'petugas_satpam' },
  { shirt: C.khaki, hat: C.navy,   asset: 'petugas_polisi' },
  { shirt: C.red,   hat: C.yellow, asset: 'petugas_damkar' },
  { shirt: C.navy,  hat: C.black,  asset: 'petugas_unit' },
];

// Warna langit menurut ketinggian kamera
const SKY_COLORS = [[0, '#c8744a'], [4000, '#8c3c2c'], [12000, '#3c1830'], [30000, '#100818']];   // langit merah berdebu

// Posisi titik api di hutan
// Posisi titik api di hutan (0 = kiri layar, 1 = kanan layar)
const FIRE_SPOTS = [.04, .11, .21, .29, .36, .44, .54, .61, .68, .76, .84, .91, .08, .40, .64, .96];

const pick = list => list[Math.floor(Math.random() * list.length)];
const playerX = side => PILLAR_X + side * 13;
const meters = y => Math.max(0, Math.floor((START_Y - y) / PX_PER_METER));

// Gedung bawaan dibuat acak tapi selalu sama (pakai angka seed)
function makeSkyline(seed, minW, maxW, minH, maxH) {
  const list = [];
  let x = -4, s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  while (x < MAX_W + 4) {
    const w = Math.round(minW + rand() * (maxW - minW));
    const h = Math.round(minH + rand() * (maxH - minH));
    list.push({ x, w, h, antenna: rand() < 0.3, step: rand() < 0.35, broken: rand() < 0.65, smoke: rand() < 0.25, crack: rand() });
    x += w + (rand() < 0.3 ? 2 : 0);
  }
  return list;
}
const BUILDINGS_FAR = makeSkyline(7, 12, 22, 90, 210);
const BUILDINGS_NEAR = makeSkyline(31, 16, 30, 50, 140);


/* =====================================================================
   6. STATUS GAME
   ===================================================================== */
let scene = 'title';   // 'title' | 'play' | 'end'

// Ganti layar: bersihkan tombol yang tersisa & ganti musik
function setScene(name) {
  scene = name;
  for (const k in pressed) pressed[k] = false;
  if (name === 'title') Sound.music('title');
  if (name === 'play')  { Sound.music('main'); Sound.sfx('start'); }
  if (name === 'end')   Sound.music('end');
}

function loadBest() { try { return +localStorage.getItem('spanduk-rekor') || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem('spanduk-rekor', String(v)); } catch (e) {} }

function finalScore() {
  return S.placed * 150 + S.maxHeight * 10 + S.downed * 50 + Math.round(S.playTime) * 2;
}

function endGame(reason = 'caught') {
  S.endReason = reason;
  S.endTimer = 0;
  S.score = finalScore();
  S.best = loadBest();
  S.newRecord = S.score > S.best;
  if (S.newRecord) saveBest(S.score);
  S.paused = false;
  Sound.duck(false);
  setScene('end');
}
let time = 0;          // waktu berjalan (untuk animasi)
let S;                 // semua status permainan

function newGame() {
  S = {
    // pemain
    y: START_Y, side: 1, switchTimer: 0, stun: 0,
    stamina: 100, tired: false, inSmoke: false, breath: 100, buff: 0,
    hanging: false, hangProgress: 0, hangY: 0, hangSide: 1,
    posterCooldown: 0, ammo: POSTER_START, emptyFlash: 0,
    pickups: [], nextPickupY: -130, floaters: [],
    // benda di dunia
    banners: [], fallingBanners: [], posters: [], drones: [], jets: [], smokes: [],
    officers: [], lifts: [], birds: [], animals: [], bubbles: [],
    birdTimer: 1, bubbleTimer: 5, message: null, messages: [], info: null, infoCooldown: 0, infoIndex: 0, cheer: null,
    helis: [], heliTimer: 10,
    // skor
    placed: 0, thrown: 0, downed: 0, ripped: 0, maxHeight: 0, playTime: 0, supports: 0, endReason: 'caught',
    // fase & suasana
    phase: 0, phaseBanner: 2.4, panic: 0, megaphone: null,
    megaphoneTimer: 3, jetTimer: 3, droneTimer: 2, smokeTimer: 0,
    // kamera & efek
    camera: CAMERA_LOWEST, shake: 0, endTimer: 0, textIndex: 0, paused: false,
  };
  addOfficers(5, 0);
  showMessage(HOW_TO_PLAY);
  // satwa yang terusir dari hutan, berkeliaran di kota
  S.animals = [
    { type: 'orangutan', x: 18, dir: 1, speed: 5 },
    { type: 'orangutan', x: W * 0.62, dir: -1, speed: 3 },
    { type: 'bear', x: W - 30, dir: -1, speed: 8 },
  ];
}

function addOfficers(count, type) {
  for (let i = 0; i < count && S.officers.length < 14; i++) {
    S.officers.push({ x: 8 + Math.random() * (W - 20), dir: Math.random() < 0.5 ? -1 : 1, bubble: 0, text: '', type });
  }
}

function newLift(side, fixed) {
  return { y: -30, side, fixed, stall: 0, wrongSide: 0, turning: 0, turnTime: 1, from: side, to: side };
}

// Beberapa petugas berteriak. text boleh berupa fungsi (biar tiap orang beda)
function shout(text, howMany = 99) {
  const shuffled = S.officers.slice().sort(() => Math.random() - 0.5);
  shuffled.slice(0, howMany).forEach(o => {
    o.bubble = 1.3 + Math.random() * 0.6;
    o.text = typeof text === 'function' ? text() : text;
  });
}


/* =====================================================================
   7. LOGIKA GAME
   ===================================================================== */
function update(dt) {
  if (donateOpen) return;   // halaman donasi terbuka
  time += dt;

  // SELECT: ganti warna layar
  if (tapped('select')) { setGreenScreen(!stage.classList.contains('green')); Sound.sfx('select'); }

  if (scene === 'title') {
    if (easterTimer > 0) easterTimer -= dt;
    if (tapped('start')) { newGame(); setScene('play'); }
    return;
  }
  if (scene === 'end') {
    // Layar hasil hanya ditutup oleh pemain (START atau A), tidak otomatis
    S.endTimer += dt;
    if (S.endTimer < 1.5) { tapped('start'); tapped('a'); return; }
    if (tapped('start') || tapped('a')) setScene('title');
    return;
  }

  // Kotak pesan terbuka: game berhenti sampai pemain menekan START
  if (S.message) {
    if (tapped('start')) closeMessage();
    return;
  }

  // START: jeda / lanjut
  if (tapped('start')) { S.paused = !S.paused; Sound.sfx('pause'); Sound.duck(S.paused); }
  if (S.paused) return;

  S.playTime += dt;
  if (S.shake > 0) S.shake -= dt;
  if (S.phaseBanner > 0) S.phaseBanner -= dt;
  S.panic = Math.min(100, S.panic + dt * (0.6 + S.phase * 0.3));

  updatePhase();
  updatePlayer(dt);
  updateBreath(dt);
  if (S.breath <= 0) { endGame('ispa'); return; }
  updateSupport(dt);
  updateWildlife(dt);
  updateInfo(dt);
  updateHelicopters(dt);
  updateHanging(dt);
  updatePickups(dt);
  updatePosters(dt);
  if (updateLifts(dt)) return;   // true = pemain tertangkap
  updateGroundCrew(dt);
  updateSmoke(dt);
  updateWaterJets(dt);
  updateDrones(dt);
  updateOfficers(dt);
  updateMegaphone(dt);
  updateCamera(dt);
  Sound.intensity(S.phase, meters(S.y));
}

// Tingkat bahaya: naik seiring KETINGGIAN, dan seiring waktu setelah fase terakhir
const danger = () =>
  meters(S.y) * DANGER_PER_METER +
  Math.max(0, S.playTime - PHASES[PHASE.FULL_ALERT].t) * 0.15;

function updatePhase() {
  let target = S.phase;
  const height = meters(S.y);
  PHASES.forEach((p, i) => {
    if (i > 0 && (S.playTime >= p.t || S.placed >= p.b || height >= p.m)) target = Math.max(target, i);
  });
  while (S.phase < target) enterPhase(S.phase + 1);
}

function enterPhase(p) {
  S.phase = p;
  S.phaseBanner = 2.4;
  S.shake = 0.3;
  addOfficers(2, PHASES[p].officer);
  if (p === PHASE.POLICE) { S.lifts.push(newLift(-S.side, false)); showTipOnce('lift'); }
  if (p === PHASE.FULL_ALERT) S.lifts.push(newLift(-S.lifts[0].side, true));
  shout(() => pick(PHASES[p].shouts));
  Sound.sfx('phase');
}

// --- Pemain: naik, turun, pindah sisi, tenaga
function updatePlayer(dt) {
  if (S.stun > 0) S.stun -= dt;
  if (S.switchTimer > 0) S.switchTimer -= dt;

  const canMove = !S.hanging && S.stun <= 0 && S.switchTimer <= 0;
  if (canMove) {
    const thinAir = Math.min(MAX_THIN_AIR, meters(S.y) * THIN_AIR_PER_METER);
    if (keys.up && !S.tired) { S.y -= CLIMB_SPEED * dt; S.stamina -= (10 + thinAir) * dt; }
    else if (keys.down)      { S.y += DROP_SPEED * dt;  S.stamina += 12 * dt; }
    else                     { S.stamina += 20 * dt; }
    if (pressed.left && S.side !== -1)  { S.side = -1; S.switchTimer = 0.35; Sound.sfx('switch'); }
    if (pressed.right && S.side !== 1)  { S.side = 1;  S.switchTimer = 0.35; Sound.sfx('switch'); }
  } else {
    S.stamina += 12 * dt;
  }
  pressed.left = pressed.right = pressed.up = pressed.down = pressed.b = false;

  // Di dalam asap tenaga terkuras
  const px = playerX(S.side);
  S.inSmoke = S.smokes.some(m => px > m.x && px < m.x + m.w && S.y > m.y && S.y < m.y + m.h);
  if (S.inSmoke) { S.stamina -= 26 * dt; Sound.sfx('cough'); }

  S.stamina = Math.max(0, Math.min(100, S.stamina));
  if (S.stamina <= 0 && !S.tired) { S.tired = true; Sound.sfx('tired'); }
  if (S.tired && S.stamina >= 30) S.tired = false;

  S.y = Math.min(START_Y, S.y);
  S.maxHeight = Math.max(S.maxHeight, meters(S.y));
}

function playerFree() {
  return !S.hanging && S.stun <= 0 && S.switchTimer <= 0;
}

function canPlaceBanner(y, side) {
  if (y > MIN_BANNER_Y) return false;
  return S.banners.every(b => b.side !== side || Math.abs(b.y - y) >= BANNER_GAP);
}

// --- Pasang spanduk: tahan A
function updateHanging(dt) {
  if (S.hanging) {
    if (!keys.a) { S.hanging = false; S.hangProgress = 0; return; }
    const before = Math.floor(S.hangProgress * 5);
    S.hangProgress += dt / HANG_TIME;
    if (Math.floor(S.hangProgress * 5) > before) Sound.sfx('hangTick', S.hangProgress);
    if (S.hangProgress >= 1) {
      Sound.sfx('place');
      S.banners.push({
        y: S.hangY, side: S.hangSide, color: S.placed,
        text: BANNER_TEXT[S.textIndex++ % BANNER_TEXT.length],
      });
      S.hanging = false;
      S.hangProgress = 0;
      S.placed++;
      addAmmo(POSTER_PER_BANNER, playerX(S.side), S.y - 14);
      S.panic = Math.min(100, S.panic + 12);
      S.shake = 0.3;
      shout(() => pick(PHASES[S.phase].shouts));
    }
  } else if (playerFree() && keys.a && canPlaceBanner(S.y, S.side)) {
    S.hanging = true;
    S.hangProgress = 0;
    S.hangY = S.y;
    S.hangSide = S.side;
  }
}

function dropBanner(banner, reason) {
  S.ripped++;
  Sound.sfx('rip');
  const x = banner.side > 0 ? PILLAR_X + PILLAR_W / 2 + 2 : PILLAR_X - PILLAR_W / 2 - 2 - BANNER_W;
  S.fallingBanners.push({ x, y: banner.y, vy: 0, life: 3 });
  if (reason) shout(reason, 3);
}

// Hapus spanduk yang memenuhi syarat, sambil memberi alasan
function removeBanners(test, reason) {
  S.banners = S.banners.filter(b => {
    if (test(b)) { dropBanner(b, reason); return false; }
    return true;
  });
}

// Pemain kena: jatuh sedikit & pusing
function knockDown(distance, stunTime) {
  if (S.stun > 0) return;
  S.y = Math.min(START_Y, S.y + distance);
  S.stun = stunTime;
  S.hanging = false;
  S.hangProgress = 0;
  S.shake = 0.35;
  Sound.sfx('hit');
}

// --- Nafas: asap melukai paru-paru, info ISPA muncul saat masuk asap
function updateBreath(dt) {
  if (S.inSmoke) {
    S.breath -= SMOKE_DAMAGE * dt;
    Sound.sfx('hurt');
  } else {
    S.breath += BREATH_RECOVER * dt;
  }
  S.breath = Math.max(0, Math.min(100, S.breath));
}

// Info ISPA / berita saat asap datang: tidak menjeda game, menutup sendiri
function showNextInfo() {
  if (S.info || S.infoCooldown > 0) return;
  S.info = { fact: INFO_FEED[S.infoIndex++ % INFO_FEED.length], t: INFO_DURATION };
  S.infoCooldown = INFO_DURATION + INFO_GAP;
  Sound.sfx('info');
}

// ---------- Kotak pesan: menjeda game, ditutup pemain dengan START ----------
function showMessage(msg) {
  S.messages.push(msg);
  if (!S.message) openNextMessage();
}
function openNextMessage() {
  S.message = S.messages.shift() || null;
  if (S.message) { Sound.sfx('info'); Sound.duck(true); }
}
function closeMessage() {
  S.message = null;
  for (const k in keys) keys[k] = false;   // supaya A/B yang tertahan tidak langsung jalan
  Sound.duck(false);
  Sound.sfx('select');
  openNextMessage();
}

// Tips sekali saja per browser
let seenTips = {};
try { seenTips = JSON.parse(localStorage.getItem('sua-tips') || '{}'); } catch (e) {}
function showTipOnce(key) {
  if (seenTips[key]) return;
  seenTips[key] = true;
  try { localStorage.setItem('sua-tips', JSON.stringify(seenTips)); } catch (e) {}
  showMessage(TIPS[key]);
}
function updateInfo(dt) {
  if (S.infoCooldown > 0) S.infoCooldown -= dt;
  if (S.info) { S.info.t -= dt; if (S.info.t <= 0) S.info = null; }
}

// --- Gelembung dukungan: tenaga tak terbatas selama BUFF_TIME detik
function updateSupport(dt) {
  S.bubbleTimer -= dt;
  if (S.bubbleTimer <= 0) {
    S.bubbleTimer = BUBBLE_GAP_MIN + Math.random() * (BUBBLE_GAP_MAX - BUBBLE_GAP_MIN);
    const dir = Math.random() < 0.5 ? 1 : -1;
    S.bubbles.push({ x: dir > 0 ? -10 : W + 10, y: S.y - 50 + Math.random() * 60, vx: dir * (14 + Math.random() * 6), seed: Math.random() * 9 });
  }
  const px = playerX(S.side), py = S.y - 4;
  S.bubbles = S.bubbles.filter(b => {
    b.x += b.vx * dt;
    b.y += Math.sin(time * 2 + b.seed) * 8 * dt;
    if (Math.hypot(b.x - px, b.y - py) < 14) {
      S.buff = BUFF_TIME;
      S.supports++;
      S.cheer = { text: pick(SUPPORT_MESSAGES), t: 2.5 };
      Sound.sfx('buff');
      return false;
    }
    return b.x > -20 && b.x < W + 20;
  });
  if (S.buff > 0) {
    S.buff -= dt;
    S.stamina = 100;
    S.tired = false;
  }
  if (S.cheer) { S.cheer.t -= dt; if (S.cheer.t <= 0) S.cheer = null; }
}

// --- Satwa: burung melintas di langit, orangutan & beruang di jalanan
function updateWildlife(dt) {
  S.birdTimer -= dt;
  if (S.birdTimer <= 0) {
    S.birdTimer = 2.5 + Math.random() * 3;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y = S.y - 30 - Math.random() * 180, speed = 22 + Math.random() * 14;
    if (Math.random() < 0.4) {
      S.birds.push({ type: 'hornbill', x: dir > 0 ? -14 : W + 14, y, vx: dir * speed, seed: Math.random() * 9 });
    } else {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        S.birds.push({ type: 'crow', x: (dir > 0 ? -10 : W + 10) - dir * i * 9, y: y + (i % 2) * 6 - i, vx: dir * speed * 1.2, seed: i });
      }
    }
  }
  S.birds = S.birds.filter(b => {
    b.x += b.vx * dt;
    b.y += Math.sin(time * 3 + b.seed) * 4 * dt;
    return b.vx > 0 ? b.x < W + 40 : b.x > -40;
  });
  S.animals.forEach(a => {
    a.x += a.dir * a.speed * dt;
    if (a.x < 8 || a.x > W - 8) { a.dir *= -1; a.x = Math.max(8, Math.min(W - 8, a.x)); }
    if (Math.random() < dt * 0.15) a.dir *= -1;
  });
}

// --- Helikopter polisi: sesekali lewat dengan lampu sorot
function updateHelicopters(dt) {
  if (S.phase >= PHASE.POLICE) {
    S.heliTimer -= dt;
    if (S.heliTimer <= 0) {
      S.heliTimer = HELI_GAP_MIN + Math.random() * (HELI_GAP_MAX - HELI_GAP_MIN);
      const dir = Math.random() < 0.5 ? 1 : -1;
      S.helis.push({ x: dir > 0 ? -30 : W + 30, y: S.y - 110 - Math.random() * 50, vx: dir * 30, seed: Math.random() * 9 });
      S.megaphone = { text: pick(['DARI UDARA: TURUN!', 'KAMI LIHAT KAMU!', 'HELI SIAGA!']), t: 2.2 };
    }
  }
  S.helis = S.helis.filter(h => {
    h.x += h.vx * dt;
    h.y += Math.sin(time * 1.5 + h.seed) * 6 * dt;
    if (h.x > -40 && h.x < W + 40) Sound.sfx('heli');
    return h.vx > 0 ? h.x < W + 50 : h.x > -50;
  });
}

// --- Amunisi poster
function addAmmo(amount, x, y) {
  S.ammo = Math.min(POSTER_MAX, S.ammo + amount);
  S.floaters.push({ x, y, text: '+' + amount, life: 1 });
}

// Poster yang menempel di tiang: muncul terus di atas pemain, diambil saat dilewati
function updatePickups(dt) {
  while (S.nextPickupY > S.y - 420) {
    S.pickups.push({ y: S.nextPickupY });
    S.nextPickupY -= PICKUP_GAP_MIN + Math.random() * (PICKUP_GAP_MAX - PICKUP_GAP_MIN);
  }
  S.pickups = S.pickups.filter(p => {
    if (Math.abs(p.y - S.y) < 12 && S.switchTimer <= 0) {
      addAmmo(POSTER_PER_PICKUP, PILLAR_X, p.y - 12);
      Sound.sfx('pickup');
      return false;
    }
    return p.y < S.y + 500;   // buang yang sudah jauh di bawah
  });
  S.floaters = S.floaters.filter(f => { f.life -= dt; f.y -= 18 * dt; return f.life > 0; });
  if (S.emptyFlash > 0) S.emptyFlash -= dt;
}

// Target bidik otomatis: drone atau keranjang skylift terdekat
function targetPosition(t) {
  if (t.drone) return { x: t.drone.x, y: t.drone.y, alive: !t.drone.dead };
  const lift = t.lift;
  return { x: PILLAR_X + lift.side * 30, y: lift.y - 4, alive: lift.stall <= 0 && lift.turning <= 0 };
}

function findTarget(x, y) {
  let best = null, bestDist = POSTER_RANGE;
  const consider = t => {
    const p = targetPosition(t);
    const dist = Math.hypot(p.x - x, p.y - y);
    if (p.alive && dist < bestDist) { bestDist = dist; best = t; }
  };
  S.drones.forEach(d => consider({ drone: d }));
  S.lifts.forEach(l => consider({ lift: l }));
  return best;
}

// --- Poster: tahan B. Otomatis mengincar drone ATAU skylift terdekat
function updatePosters(dt) {
  if (S.posterCooldown > 0) S.posterCooldown -= dt;

  if (keys.b && S.posterCooldown <= 0 && playerFree()) {
    S.posterCooldown = POSTER_COOLDOWN;
    if (S.ammo <= 0) {
      S.emptyFlash = 0.6;
      S.posterCooldown = 0.4;
      Sound.sfx('empty');
    } else {
      S.ammo--;
      S.thrown++;
      Sound.sfx('throw');
      const x = playerX(S.side) + S.side * 6, y = S.y - 2;
      const design = Math.floor(Math.random() * frameCount('poster'));
      const target = findTarget(x, y);
      if (target) {
        const t = targetPosition(target);
        const dx = t.x - x, dy = t.y - y, len = Math.hypot(dx, dy) || 1;
        S.posters.push({ x, y, vx: dx / len * 130, vy: dy / len * 130, target, life: 1.8, design });
      } else {
        S.posters.push({ x, y, vx: S.side * 18, vy: -28, target: null, life: 25, design });
      }
    }
  }

  S.posters = S.posters.filter(p => {
    p.life -= dt;
    if (p.target) {
      const t = targetPosition(p.target);
      if (t.alive) {   // belok sedikit mengikuti target
        const dx = t.x - p.x, dy = t.y - p.y, len = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * 4);
        p.vx += (dx / len * 130 - p.vx) * k;
        p.vy += (dy / len * 130 - p.vy) * k;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else {                  // melayang jatuh
      p.vy = Math.min(42, p.vy + 50 * dt);
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(time * 7 + p.y) * 12) * dt;
    }

    for (const d of S.drones) {
      if (!d.dead && Math.hypot(p.x - d.x, p.y - d.y) < 10) {
        d.dead = true;
        S.downed++;
        Sound.sfx('droneDown');
        shout(() => pick(['KAMERA KETUTUP!', 'DRONE MENDARAT', 'YAH, GELAP']), 3);
        return false;
      }
    }
    for (const lift of S.lifts) {
      const bx = PILLAR_X + lift.side * 30;
      if (lift.turning <= 0 && Math.abs(p.x - bx) < 13 && Math.abs(p.y - lift.y) < 12) {
        lift.stall = 2.6;
        Sound.sfx('stall');
        shout(() => pick(['BACA DULU...', 'HMM, BENAR JUGA', 'POSTER APA INI?']), 2);
        return false;
      }
    }
    if (p.y >= 10) { shout(() => pick(['AMBIL!', 'SITA!', 'BACA DONG']), 2); return false; }
    return p.life > 0 && p.x > -20 && p.x < W + 20;
  });
}

// --- Skylift: mengejar pemain, mencopot spanduk yang dilewati
function updateLifts(dt) {
  for (const lift of S.lifts) {
    const speed = (12 + S.phase * 5 + danger()) * (lift.fixed ? 0.65 : 1);
    if (lift.stall > 0) { lift.stall -= dt; continue; }

    // Lift biasa pindah sisi kalau pemain pindah sisi (butuh waktu)
    if (!lift.fixed) {
      if (lift.turning > 0) {
        lift.turning -= dt;
        if (lift.turning <= 0) { lift.side = lift.to; lift.wrongSide = 0; }
      } else if (lift.side !== S.side) {
        lift.wrongSide += dt;
        if (lift.wrongSide > Math.max(0.2, 0.8 - S.phase * 0.1)) {
          lift.turnTime = lift.turning = Math.max(0.9, 2.4 - S.phase * 0.25 - danger() * 0.1);
          lift.from = lift.side;
          lift.to = S.side;
        }
      } else {
        lift.wrongSide = 0;
      }
    }
    if (lift.turning > 0) continue;

    const diff = (S.y + 12) - lift.y;
    lift.y = Math.min(-30, lift.y + Math.sign(diff) * Math.min(Math.abs(diff), speed * dt));

    removeBanners(b => b.side === lift.side && lift.y >= b.y - 4 && lift.y <= b.y + BANNER_H, 'COPOT!');

    if (lift.side === S.side && Math.abs(lift.y - 12 - S.y) < 9) {
      endGame();
      return true;
    }
  }
  return false;
}

// --- Petugas di bawah mencabut spanduk yang rendah
function updateGroundCrew(dt) {
  if (S.phase < PHASE.POLICE) return;
  removeBanners(b => b.y > -170 && Math.random() < dt * 0.1 * S.phase, 'CABUT!');
}

// --- Gumpalan asap lewat dari samping
function updateSmoke(dt) {
  if (S.phase >= PHASE.SMOKE) {
    S.smokeTimer -= dt;
    if (S.smokeTimer <= 0) {
      S.smokeTimer = Math.max(1.8, 4.5 - (S.phase - PHASE.SMOKE) * 0.6 - danger() * 0.05);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const w = 50 + Math.random() * 50, h = 28 + Math.random() * 26;
      S.smokes.push({
        x: dir > 0 ? -w : W, y: S.y - 80 + Math.random() * 110, w, h,
        vx: dir * (9 + Math.random() * 10), seed: Math.random() * 100,
        shape: Math.floor(Math.random() * frameCount('asap')),
      });
      showNextInfo();
    }
  }
  S.smokes = S.smokes.filter(m => {
    m.x += m.vx * dt;
    m.y += Math.sin(time + m.seed) * 3 * dt;
    return m.x > -m.w - 10 && m.x < W + 10;
  });
}

// --- Semprotan damkar: ada peringatan dulu, lalu menyembur
function updateWaterJets(dt) {
  if (S.phase >= PHASE.FIRE_DEPT) {
    S.jetTimer -= dt;
    if (S.jetTimer <= 0) {
      S.jetTimer = Math.max(1.6, 6 - (S.phase - PHASE.FIRE_DEPT) * 1.4 - danger() * 0.1);
      S.jets.push({
        y: S.y + (Math.random() * 40 - 20),
        side: Math.random() < 0.65 ? S.side : -S.side,
        warn: Math.max(0.6, 1.1 - danger() * 0.02),
        fire: 0.5,
      });
      Sound.sfx('warn');
    }
  }
  S.jets = S.jets.filter(j => {
    if (j.warn > 0) {
      j.warn -= dt;
      if (j.warn <= 0) Sound.sfx('jet');
      return true;
    }
    j.fire -= dt;
    removeBanners(b => b.side === j.side && j.y >= b.y - 4 && j.y <= b.y + BANNER_H, 'BASAH!');
    if (j.side === S.side && S.switchTimer <= 0 && Math.abs(S.y - j.y) < 10) knockDown(45, 0.9);
    return j.fire > 0;
  });
}

// --- Drone: terbang mengejar pemain
function updateDrones(dt) {
  if (S.phase >= PHASE.DRONE) {
    S.droneTimer -= dt;
    const alive = S.drones.filter(d => !d.dead).length;
    const maxDrones = S.phase - 2 + Math.floor(meters(S.y) / 150);
    if (S.droneTimer <= 0 && alive < maxDrones) {
      S.droneTimer = Math.max(2, 6 - (S.phase - PHASE.DRONE) * 2 - danger() * 0.1);
      S.drones.push({ x: Math.random() < 0.5 ? -8 : W + 8, y: S.y - 60 - Math.random() * 60, life: 12, dead: false, vy: 0 });
      showTipOnce('drone');
    }
  }
  S.drones = S.drones.filter(d => {
    if (d.dead) {             // jatuh ketutup poster
      d.vy += 70 * dt;
      d.y += d.vy * dt;
      return d.y < S.camera + H + 40;
    }
    const dx = playerX(S.side) - d.x, dy = (S.y - 4) - d.y;
    const dist = Math.hypot(dx, dy) || 1, speed = 24 + S.phase * 3 + danger();
    d.x += (dx / dist * speed + Math.sin(time * 3 + d.y) * 10) * dt;
    d.y += dy / dist * speed * dt;
    d.life -= dt;
    if (dist < 8) { knockDown(30, 0.7); shout('FOTO!', 2); return false; }
    return d.life > 0;
  });

  S.fallingBanners = S.fallingBanners.filter(f => {
    f.vy += 60 * dt;
    f.y += f.vy * dt;
    f.life -= dt;
    return f.life > 0;
  });
}

// --- Petugas lari panik di bawah
function updateOfficers(dt) {
  const liftBlinded = S.lifts.some(l => l.stall > 0);
  S.officers.forEach(o => {
    const speed = liftBlinded ? 45 : 8 + S.panic * 0.3 + S.phase * 4;
    o.x += o.dir * speed * dt;
    if (o.x < 4 || o.x > W - 12) { o.dir *= -1; o.x = Math.max(4, Math.min(W - 12, o.x)); }
    if (Math.random() < dt * (0.3 + S.panic / 60)) o.dir *= -1;
    if (o.bubble > 0) o.bubble -= dt;
    else if (Math.random() < dt * (0.05 + S.panic / 90)) {
      o.bubble = 1.3;
      o.text = Math.random() < 0.3 ? '!' : pick(PHASES[S.phase].shouts);
    }
  });
}

function updateMegaphone(dt) {
  if (S.phase < PHASE.POLICE) return;
  if (S.megaphone) { S.megaphone.t -= dt; if (S.megaphone.t <= 0) S.megaphone = null; }
  S.megaphoneTimer -= dt;
  if (S.megaphoneTimer <= 0) {
    S.megaphoneTimer = 5 + Math.random() * 4;
    S.megaphone = { text: pick(MEGAPHONE), t: 2.2 };
    Sound.sfx('megaphone');
  }
}

function updateCamera(dt) {
  const target = Math.min(CAMERA_LOWEST, S.y - 150);
  S.camera += (target - S.camera) * Math.min(1, dt * 6);
}


/* =====================================================================
   8. GAMBAR PIXEL DASAR
   ===================================================================== */
function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Kotak dengan garis hitam 1 piksel
function box(x, y, w, h, fill) {
  rect(x, y, w, h, C.black);
  if (w > 2 && h > 2) rect(x + 1, y + 1, w - 2, h - 2, fill);
}

function dashedBox(x, y, w, h, color) {
  for (let i = 0; i < w; i += 4) { rect(x + i, y, 2, 1, color); rect(x + i, y + h - 1, 2, 1, color); }
  for (let i = 0; i < h; i += 4) { rect(x, y + i, 1, 2, color); rect(x + w - 1, y + i, 1, 2, color); }
}

function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
  ctx.fill();
}

// Teks pixel. outline = warna garis tepi (opsional)
function text(str, x, y, color = C.black, align = 'left', outline, size = 8) {
  ctx.font = `${size}px 'Press Start 2P', monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  x = snap(x); y = snap(y);
  if (outline) {
    ctx.fillStyle = outline;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) ctx.fillText(str, x + dx, y + dy);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function textWidth(str, size = 8) {
  ctx.font = `${size}px 'Press Start 2P', monospace`;
  return ctx.measureText(str).width;
}

function mixColor(a, b, f) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const mix = (x, y) => Math.round(x + (y - x) * f).toString(16).padStart(2, '0');
  return '#' + mix(A >> 16, B >> 16) + mix((A >> 8) & 255, (B >> 8) & 255) + mix(A & 255, B & 255);
}

function skyColor(height) {
  for (let i = 1; i < SKY_COLORS.length; i++) {
    if (height < SKY_COLORS[i][0]) {
      const [h0, c0] = SKY_COLORS[i - 1], [h1, c1] = SKY_COLORS[i];
      return mixColor(c0, c1, (height - h0) / (h1 - h0));
    }
  }
  return SKY_COLORS[SKY_COLORS.length - 1][1];
}

const blink = period => time % period < period / 2;


/* =====================================================================
   9. GAMBAR DUNIA
   Pola tiap fungsi:  if (drawSprite(...)) return;  lalu versi pixel.
   ===================================================================== */

// ---------- Benda kecil ----------
function drawCloud(x, y, hazy) {
  const name = hazy && hasAsset('awan_kabut') ? 'awan_kabut' : 'awan';
  if (drawSpriteBox(name, 0, x, y - 2)) return;
  const c = hazy ? C.ash : C.white;   // awan abu sisa kebakaran
  rect(x + 3, y, 10, 4, c); rect(x, y + 3, 16, 4, c); rect(x + 6, y - 2, 5, 3, c);
}

function drawTree(x, y, big) {
  const w = big ? 14 : 10, h = big ? 18 : 12;
  if (drawSprite(big ? 'pohon_besar' : 'pohon_kecil', 0, x + w / 2, y + h + 4)) return;
  // pohon mati: batang & ranting tanpa daun
  const cx = x + w / 2;
  rect(cx - 1, y + 2, 2, h + 2, C.deadWood);
  rect(cx - 4, y + 4, 3, 1, C.deadWood); rect(cx - 5, y + 2, 1, 2, C.deadWood);
  rect(cx + 1, y + 6, 4, 1, C.deadWood); rect(cx + 4, y + 4, 1, 2, C.deadWood);
  rect(cx - 3, y + 9, 2, 1, C.deadWood);
  rect(cx, y, 1, 2, C.deadWood);
}

function drawPuff(x, y, r, color) {
  if (drawSpriteBox('asap_kecil', 0, x - r, y - r, r * 2, r * 2)) return;
  circle(x, y, r, color);
}

function drawMonas(x, ground) {
  if (drawSprite('monas', 0, x, ground)) return;
  rect(x - 9, ground - 12, 18, 12, C.buildingFar);
  rect(x - 3, ground - 70, 6, 58, C.buildingFar);
  rect(x - 2, ground - 76, 4, 6, C.buildingFar);
  rect(x - 1, ground - 81, 3, 5, C.yellow);
}

// ---------- Hutan Kalimantan terbakar di cakrawala ----------
function drawForest(horizonY, fireCount) {
  if (hasAsset('hutan')) {
    const a = ASSETS.hutan;
    rect(0, horizonY - 8 + a.height - 1, W, H, a.fill || C.forestDark);
    drawSpriteRow('hutan', 0, horizonY - 8);
  } else {
    rect(0, horizonY, W, H - horizonY + 10, C.forestDark);
    for (let x = -2; x < W; x += 5) { const h = 3 + ((x * 7) % 4); rect(x, horizonY - h, 5, h + 1, C.forest); }
    for (let r = 1; r < 6; r++) {
      for (let x = (r % 2) * 3; x < W; x += 7) rect(x, horizonY + r * 9, 4, 3, r % 2 ? C.forest : C.forestDark);
    }
  }

  for (let i = 0; i < fireCount; i++) {
    const fx = FIRE_SPOTS[i % FIRE_SPOTS.length] * W;
    const fy = horizonY - 2 + (i >= 12 ? 14 : 0);
    if (!drawSprite('api', time * 8 + i, fx, fy + 3)) {
      rect(fx - 5, fy, 11, 4, C.burnt);
      const tall = Math.sin(time * 12 + i) > 0;
      rect(fx - 2, fy - 5, 5, 6, C.red);
      rect(fx - 1, fy - (tall ? 9 : 7), 3, tall ? 5 : 3, C.orange);
      rect(fx, fy - 4, 1, 3, C.yellow);
    }
    // asap mengepul dari api
    ctx.globalAlpha = 0.5;
    for (let k = 0; k < 5; k++) {
      const age = (time * 9 + k * 24 + i * 13) % 120;
      drawPuff(fx + Math.sin(age * 0.05 + i) * 4 + age * 0.15, fy - 8 - age, 2 + age * 0.06, k % 2 ? C.smoke : C.grey);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- Gedung kota ----------
function drawBuildings(list, groundY, wall, windows, outlined, assetName) {
  if (hasAsset(assetName)) {
    const a = ASSETS[assetName];
    if (groundY - a.height > H) return;
    rect(0, groundY - 1, W, H, a.fill || wall);
    drawSpriteRow(assetName, 0, groundY - a.height);
    return;
  }
  const BITES = [0, 3, 7, 2, 10, 5, 1, 8, 4, 6];   // pola atap runtuh
  list.forEach((b, i) => {
    const top = groundY - b.h;
    if (top > H || b.x > W) return;
    const bite = x => b.broken ? BITES[(Math.floor(x / 2) + i * 3) % BITES.length] : 0;

    // badan gedung, dibuat per kolom 2 piksel supaya atapnya bisa compang-camping
    if (outlined) for (let x = b.x; x < b.x + b.w; x += 2) rect(x - 1, top + bite(x) - 1, 4, H - top, C.black);
    for (let x = b.x; x < b.x + b.w; x += 2) rect(x, top + bite(x), 2, H - top, wall);
    if (b.step && !b.broken) rect(b.x + 3, top - 6, b.w - 6, 6, wall);
    if (b.antenna) {   // antena bengkok
      rect(b.x + (b.w >> 1), top - 8, 1, 8, outlined ? C.black : wall);
      rect(b.x + (b.w >> 1), top - 8, 4, 1, outlined ? C.black : wall);
    }

    // jendela: kebanyakan gelap, sebagian pecah, sebagian terbakar
    for (let y = top + 12; y < Math.min(H, groundY); y += 6) {
      for (let x = b.x + 2; x < b.x + b.w - 2; x += 4) {
        const k = (x * 3 + y * 7 + i) % 9;
        if (k < 5) rect(x, y, 2, 3, windows);
        else if (k === 5) rect(x, y, 2, 3, C.crack);
        else if (k === 6 && b.broken) rect(x, y, 2, 3, Math.sin(time * 9 + x + y) > 0 ? C.fire : C.fireBright);
      }
    }

    // retakan
    if (b.crack > 0.4) {
      const cx = b.x + Math.floor(b.w * b.crack * 0.7);
      for (let k = 0; k < 7; k++) rect(cx + (k % 2), top + 14 + k * 3, 1, 3, C.crack);
    }

    // asap dari atap yang terbakar
    if (b.smoke) {
      ctx.globalAlpha = 0.45;
      for (let k = 0; k < 4; k++) {
        const age = (time * 8 + k * 14 + i * 7) % 56;
        drawPuff(b.x + b.w / 2 + age * 0.2, top - age, 2 + age * 0.08, k % 2 ? C.smoke : C.grey);
      }
      ctx.globalAlpha = 1;
    }
  });
}

// ---------- Latar: langit, bintang, awan, hutan, gedung, penanda tinggi ----------
function drawBackground(cam) {
  const height = Math.max(0, -cam);
  const climbed = Math.max(0, CAMERA_LOWEST - cam);
  const haze = S.phase >= PHASE.SMOKE ? 0.45 : S.phase * 0.12;

  rect(0, 0, W, H, mixColor(skyColor(height), '#c89060', height < 20000 ? haze : 0));

  // bintang di ketinggian
  if (height > 9000) {
    ctx.globalAlpha = Math.min(1, (height - 9000) / 8000);
    const row = Math.floor(cam * 0.3 / 40);
    for (let i = row - 1; i < row + 9; i++) {
      for (let k = 0; k < 4; k++) rect(Math.abs((i * 97 + k * 53) % W), i * 40 + k * 10 - cam * 0.3, 1, 1, C.white);
    }
    ctx.globalAlpha = 1;
  }

  // awan (bergerak lebih lambat dari kamera)
  if (height < 26000) {
    const shift = cam * 0.5;
    for (let i = Math.floor((shift - 20) / 70); i <= Math.ceil((shift + H) / 70); i++) {
      drawCloud(((i * 73) % (W - 20) + (W - 20)) % (W - 20), i * 70 - shift, true);
    }
  }

  // cakrawala naik pelan saat memanjat, gedung tenggelam ke bawah
  const horizonY = Math.max(150, 252 - climbed * 0.06);
  drawForest(horizonY, Math.min(16, 4 + S.phase * 2));
  const farGround = 182 + climbed * 0.2, nearGround = 182 + climbed * 0.45;
  drawMonas(28, farGround - 4);
  drawBuildings(BUILDINGS_FAR, farGround, C.buildingFar, C.buildingFarWindow, false, 'skyline_jauh');
  // matahari menembus kabut: di depan gedung jauh, di belakang gedung dekat
  if (height < 26000) drawSun(W * 0.72, 92 + Math.min(40, (height - 228) * 0.01), 16);
  drawBuildings(BUILDINGS_NEAR, nearGround, C.buildingNear, C.buildingNearWindow, true, 'skyline_dekat');
}

// Penanda ketinggian: garis putus-putus + label dalam kotak supaya selalu terbaca
function drawHeightMarkers(cam) {
  HEIGHT_MARKERS.forEach(([m, label]) => {
    const y = Math.round(START_Y - m * PX_PER_METER - cam);
    if (y < HUD_H + 14 || y > H + 2) return;   // jangan tertutup HUD
    for (let x = 0; x < W; x += 6) rect(x, y, 3, 1, C.white);
    const w = Math.ceil(textWidth(label, 6)) + 6;
    ctx.globalAlpha = 0.8;
    rect(2, y - 11, w, 10, C.black);
    ctx.globalAlpha = 1;
    rect(2, y - 1, 3, 1, C.black);
    text(label, 5, y - 9, C.white, 'left', null, 6);
  });
}

// ---------- Tanah Bundaran HI ----------
function drawGround(cam) {
  const g = -cam;
  if (g > H + 60) return;

  // trotoar kota
  if (!drawSpriteRow('rumput', 0, g - 46)) rect(0, g - 46, W, 2, C.black);
  rect(0, g - 44, W, 22, C.pavement);
  for (let x = 0; x < W; x += 8) rect(x, g - 44, 1, 22, C.pavementDark);
  rect(0, g - 33, W, 1, C.pavementDark);
  for (let x = 12; x < W; x += 37) {   // retakan trotoar
    rect(x, g - 42, 1, 4, C.crack); rect(x + 1, g - 38, 1, 4, C.crack); rect(x, g - 34, 1, 3, C.crack);
  }
  drawRubble(4, g - 22);
  drawRubble(W - 22, g - 22);

  // tanah di sekitar alas patung
  if (!drawSpriteBox('tanah', 0, 0, g - 22, W, 24)) {
    rect(0, g - 22, W, 24, C.soil);
    rect(0, g - 22, W, 2, C.soilDark);
    for (let x = 3; x < W; x += 9) {
      rect(x, g - 17 + (x * 7) % 9, 2, 1, C.soilDark);
      rect(x + 4, g - 12 + (x * 5) % 8, 1, 1, C.soilLight);
    }
  }

  // jalan raya
  if (!drawSpriteBox('jalan', 0, 0, g + 2, W, 60)) {
    rect(0, g, W, 2, C.black);
    rect(0, g + 2, W, 60, C.asphalt);
    for (let x = 0; x < W; x += 16) rect(x, g + 40, 8, 1, C.lane);
    for (let x = 20; x < W; x += 53) { rect(x, g + 10, 6, 1, C.crack); rect(x + 5, g + 11, 4, 1, C.crack); }
  }
  drawWreck(W - 26, g + 56, -1, C.blue);
  drawTree(0, g - 70, false);
  drawTree(W - 14, g - 72, false);
}

// ---------- Tiang & alas patung ----------
function drawPillar(cam) {
  const g = -cam;
  const pedestalTop = hasAsset('alas') ? g - 18 - ASSETS.alas.height : g - 40;
  const bottom = Math.min(H + 10, pedestalTop + 2);

  if (hasAsset('tiang')) {
    const th = ASSETS.tiang.height;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, Math.max(0, bottom)); ctx.clip();
    for (let y = Math.floor(cam / th) * th; y - cam < bottom; y += th) {
      drawSpriteBox('tiang', 0, PILLAR_X - PILLAR_W / 2, y - cam, PILLAR_W, th);
    }
    ctx.restore();
  } else {
    box(PILLAR_X - PILLAR_W / 2, -10, PILLAR_W, bottom + 10, C.stone);
    rect(PILLAR_X + PILLAR_W / 2 - 4, -10, 3, bottom + 9, C.stoneDark);
    for (let y = Math.floor(cam / 24) * 24; y < cam + H; y += 24) {
      if (y < -40) rect(PILLAR_X - PILLAR_W / 2 + 1, y - cam, PILLAR_W - 2, 1, C.stoneDark);
    }
  }

  if (g - 40 < H + 10 && !drawSprite('alas', 0, PILLAR_X, g - 18)) {
    box(PILLAR_X - 26, g - 40, 52, 22, C.stone);
    rect(PILLAR_X - 22, g - 36, 44, 2, C.stoneDark);
  }
}

// ---------- Spanduk ----------
// opened = 0..1 (seberapa terbuka), lines = teks atau null
function drawBanner(side, y, cam, opened, lines, color = 0) {
  const hookX = PILLAR_X + side * (PILLAR_W / 2);
  const top = y - cam, len = Math.max(2, BANNER_H * opened);
  const x = side > 0 ? hookX + 2 : hookX - 2 - BANNER_W;
  if (top > H || top + len < 0) return;

  if (!drawSpriteBox('spanduk', color, x, top, BANNER_W, len, 1, Math.max(0.05, opened))) {
    box(x, top, BANNER_W, len, C.yellow);
  }
  if (lines && opened >= 1) drawBannerText(lines, x, top);
}

// Tulisan spanduk selalu muat: ukuran huruf mengecil otomatis
// kalau baris terlalu panjang atau barisnya terlalu banyak.
const BANNER_PADDING = 4;          // jarak tulisan dari tepi kiri/kanan/bawah
const BANNER_TOP_SPACE = 5;        // ruang kosong di atas tulisan
const BANNER_TOP_SPACE_ASSET = 10; // ruang di atas kalau pakai PNG spanduk (untuk gantungan)
const BANNER_LINE_GAP = 1.45;      // jarak antar baris dibanding ukuran huruf

function drawBannerText(lines, x, top) {
  const topSpace = hasAsset('spanduk') ? BANNER_TOP_SPACE_ASSET : BANNER_TOP_SPACE;
  const areaW = BANNER_W - BANNER_PADDING * 2;
  const areaH = BANNER_H - topSpace - BANNER_PADDING;

  const widest = Math.max(...lines.map(l => textWidth(l, 8)));
  const size = Math.min(8, 8 * areaW / widest, areaH / (lines.length * BANNER_LINE_GAP));

  const blockH = size * BANNER_LINE_GAP * (lines.length - 1) + size;
  const startY = top + topSpace + (areaH - blockH) / 2;
  lines.forEach((line, i) => {
    text(line, x + BANNER_W / 2, startY + i * size * BANNER_LINE_GAP, C.black, 'center', null, size);
  });
}

function drawBanners(cam) {
  S.banners.forEach(b => drawBanner(b.side, b.y, cam, 1, b.text, b.color));
  if (S.hanging) drawBanner(S.hangSide, S.hangY, cam, S.hangProgress, null, S.placed);

  S.fallingBanners.forEach(f => {
    if (!drawSpriteBox('spanduk_jatuh', time * 6, f.x, f.y - cam, BANNER_W)) box(f.x, f.y - cam, BANNER_W, 10, C.yellow);
  });

  // Pratinjau tempat pasang: putih = boleh, merah = terlalu dekat
  if (playerFree() && S.y <= MIN_BANNER_Y) {
    const ok = canPlaceBanner(S.y, S.side);
    const hookX = PILLAR_X + S.side * (PILLAR_W / 2);
    const x = S.side > 0 ? hookX + 2 : hookX - 2 - BANNER_W;
    dashedBox(x, S.y - cam, BANNER_W, BANNER_H, ok ? C.white : C.red);
    if (blink(0.6)) text(ok ? 'A' : 'X', x + BANNER_W / 2, S.y - cam + 20, ok ? C.white : C.red, 'center', C.black);
  }
}

// ---------- Pemain ----------
function drawPlayer(cam) {
  const side = S.side;
  const slide = Math.max(0, S.switchTimer) / 0.35;          // animasi pindah sisi
  const x = playerX(side) - side * 26 * slide, y = S.y - cam;
  const moving = S.stun <= 0 && !S.hanging && ((keys.up && !S.tired) || keys.down);

  rect(PILLAR_X + side * (PILLAR_W / 2 - 1), 0, 1, y, C.black);   // tali

  // 0 diam, 1-2 manjat, 3 pasang, 4 pusing, 5 capek
  let frame = 0;
  if (S.stun > 0) frame = 4;
  else if (S.tired && !moving) frame = 5;
  else if (S.hanging) frame = 3;
  else if (moving) frame = 1 + Math.floor(time * 8) % 2;

  if (!drawSprite('player', frame, x + 0.5, y + 14, side > 0)) {
    const leg = moving ? Math.round(Math.sin(time * 14) * 2) : 0;
    rect(x - 4 - side, y + 8 + leg, 3, 5, C.blue);
    rect(x + 2, y + 8 - leg, 3, 5, C.blue);
    box(x - 4, y - 1, 9, 10, C.grassDark);
    rect(x - 3, y - 4, 7, 3, C.skin);
    rect(x - 2, y - 2, 1, 1, C.black); rect(x + 2, y - 2, 1, 1, C.black);
    box(x - 4, y - 9, 9, 5, C.yellow);
    rect(x - side * 7, y, 3, 2, C.skin);
  }

  if (S.stun > 0 && !hasAsset('player')) {
    if (!drawSprite('bintang_pusing', time * 6, x, y - 11) && blink(0.3)) text('*', x - 4, y - 20, C.yellow, 'left', C.black);
  }
  if (S.tired) {
    const dropY = y - 6 + (time * 20 % 6);
    if (!drawSpriteBox('keringat', 0, x + 6, dropY)) rect(x + 6, dropY, 2, 2, C.water);
    if (blink(1)) text('CAPEK', x, y - 22, C.white, 'center', C.black);
  }
}

// ---------- Skylift ----------
function drawLifts(cam) {
  const g = -cam;
  S.lifts.forEach(lift => {
    let side = lift.side;
    if (lift.turning > 0) side = lift.from + (lift.to - lift.from) * (1 - lift.turning / lift.turnTime);

    const truckX = 6 + (side + 1) / 2 * (W - 50);
    const basketX = PILLAR_X + side * 30, basketY = lift.y - cam;
    const color = lift.fixed ? C.waterDark : C.red;

    // truk
    if (g + 2 < H && !drawSprite(lift.fixed ? 'skylift_truk_biru' : 'skylift_truk_merah', 0, truckX + 19, g + 16, side < 0)) {
      box(truckX, g + 2, 38, 10, color);
      rect(truckX + 3, g + 4, 8, 5, C.water);
      rect(truckX + 5, g + 11, 6, 4, C.black);
      rect(truckX + 27, g + 11, 6, 4, C.black);
    }

    // lengan
    ctx.strokeStyle = C.black; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(truckX + 19, g + 2); ctx.lineTo(basketX, basketY + 6); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(truckX + 19, g + 2); ctx.lineTo(basketX, basketY + 6); ctx.stroke();

    // panah kalau keranjang di luar layar
    if (basketY < -20 || basketY > H + 10) {
      if (blink(0.5)) text(basketY < 0 ? '^' : 'v', basketX, basketY < 0 ? 34 : H - 10, C.red, 'center', C.black);
      return;
    }

    // keranjang + petugas (frame 1 = ketutup poster)
    const basketAsset = lift.fixed && hasAsset('skylift_keranjang_biru') ? 'skylift_keranjang_biru' : 'skylift_keranjang';
    if (!drawSprite(basketAsset, lift.stall > 0 ? 1 : 0, basketX, basketY + 10, side < 0)) {
      box(basketX - 9, basketY, 18, 9, color);
      box(basketX - 3, basketY - 8, 7, 9, C.khaki);
      rect(basketX - 2, basketY - 11, 5, 3, C.skin);
      rect(basketX - 3, basketY - 13, 7, 2, C.navy);
      if (lift.stall > 0) box(basketX - 4, basketY - 12, 9, 7, C.yellow);
    }
    if (lift.stall > 0 && blink(0.4)) text('?!', basketX, basketY - 26, C.white, 'center', C.black);
  });
}

// ---------- Semprotan air ----------
function drawWaterJets(cam) {
  S.jets.forEach(j => {
    const y = j.y - cam;
    const edge = j.side > 0 ? W : 0, inner = PILLAR_X + j.side * (PILLAR_W / 2);
    const x0 = Math.min(edge, inner), w = Math.abs(edge - inner);

    if (j.warn > 0) {
      if (time % 0.2 < 0.12) for (let x = x0; x < x0 + w; x += 6) rect(x, y, 3, 1, C.water);
      if (!drawSpriteBox('peringatan', 0, j.side > 0 ? W - 10 : 2, y - 4)) {
        text('!', j.side > 0 ? W - 8 : 2, y - 4, C.red, 'left', C.white);
      }
    } else if (!drawSpriteRow('semprotan', time * 10, y - 5, x0, x0 + w)) {
      rect(x0, y - 4, w, 9, C.waterDark);
      rect(x0, y - 2, w, 4, C.water);
      for (let x = x0; x < x0 + w; x += 7) rect(x + (time * 80 % 7), y - 1, 3, 1, C.white);
    }
  });
}

// ---------- Drone ----------
function drawDrones(cam) {
  S.drones.forEach(d => {
    const x = d.x, y = d.y - cam;
    if (y < -10 || y > H + 10) return;
    // 0-1 baling-baling, 2 jatuh
    if (drawSprite('drone', d.dead ? 2 : Math.floor(time * 20) % 2, x, y + 4)) return;
    box(x - 5, y - 2, 11, 5, C.grey);
    const spin = time % 0.1 < 0.05;
    rect(x - 7, y - 4, spin ? 5 : 3, 1, C.black);
    rect(x + 3, y - 4, spin ? 5 : 3, 1, C.black);
    rect(x, y, 1, 1, blink(0.5) ? C.red : C.black);
    if (d.dead) rect(x - 4, y - 6, 9, 10, C.yellow);
  });
}

// ---------- Poster yang menempel di tiang (amunisi) ----------
function drawPickups(cam) {
  S.pickups.forEach(p => {
    const y = p.y - cam;
    if (y < HUD_H || y > H + 10) return;
    if (!drawSprite('poster_tiang', 0, PILLAR_X, y + 6)) {
      box(PILLAR_X - 4, y - 5, 9, 11, C.yellow);
      rect(PILLAR_X - 2, y - 2, 5, 1, C.black);
      rect(PILLAR_X - 2, y + 1, 5, 1, C.black);
      rect(PILLAR_X - 1, y - 6, 3, 2, C.white);   // selotip
    }
    if (blink(0.8)) rect(PILLAR_X + 5, y - 7, 1, 1, C.white);   // kilau
  });
  S.floaters.forEach(f => {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    text(f.text, f.x, f.y - cam, C.yellow, 'center', C.black);
    ctx.globalAlpha = 1;
  });
}

// ---------- Poster ----------
function drawPosters(cam) {
  S.posters.forEach(p => {
    if (!drawSprite('poster', p.design, p.x, p.y - cam + 5)) box(p.x - 3, p.y - cam - 4, 7, 9, C.yellow);
  });
}

// ---------- Gumpalan asap ----------
function drawSmokes(cam) {
  S.smokes.forEach(m => {
    const y = m.y - cam;
    if (y > H + 20 || y + m.h < -20) return;
    ctx.globalAlpha = 0.88;
    if (!drawSpriteBox('asap', m.shape, m.x, y, m.w, m.h)) {
      for (let i = 0; i < 7; i++) {
        const fx = m.x + (i + 0.5) * m.w / 7;
        const fy = y + m.h / 2 + Math.sin(i * 2.1 + m.seed + time) * m.h * 0.2;
        circle(fx, fy, m.h * (0.32 + ((i * 37 + m.seed) % 10) / 40), i % 2 ? C.smoke : C.grey);
        circle(fx - 2, fy - 3, m.h * 0.18, C.smokeLight);
      }
    }
    ctx.globalAlpha = 1;
  });
}

// ---------- Petugas di jalan + balon teriakan ----------
function drawSpeechBubble(str, x, y) {
  const w = textWidth(str) + 6;
  const bx = Math.max(1, Math.min(W - w - 1, x - w / 2));
  box(bx, y, w, 13, C.white);
  rect(bx + w / 2 - 1, y + 13, 2, 2, C.black);
  text(str, bx + 3, y + 3, C.black);
}

function drawOfficers(cam) {
  const g = -cam;
  if (g > H + 40) return;

  // dekorasi jalan mulai fase polisi
  if (S.phase >= PHASE.POLICE) {
    drawSprite('barikade', 0, 22, g + 18);
    drawSprite('barikade', 0, W - 22, g + 18);
    drawSprite('kerucut', 0, 46, g + 16);
    drawSprite('kerucut', 0, W - 46, g + 16);
  }

  S.officers.forEach(o => {
    const x = Math.round(o.x), y = g + 22;
    const run = Math.round(Math.sin(time * 16 + o.x) * 1.5);
    const kind = OFFICERS[o.type];
    const masked = S.phase >= PHASE.SMOKE;

    if (drawSprite(kind.asset, 1 + Math.floor(time * 8 + o.x) % 2, x + 4, y + 12, o.dir < 0)) {
      if (masked) drawSprite('masker', 0, x + 4, y + 1);
    } else {
      rect(x + 1, y + 8 + run, 2, 4, C.navy);
      rect(x + 5, y + 8 - run, 2, 4, C.navy);
      box(x, y - 1, 8, 10, kind.shirt);
      rect(x + 1, y - 5, 6, 4, C.skin);
      rect(x + 2, y - 4, 1, 1, C.black); rect(x + 5, y - 4, 1, 1, C.black);
      rect(x, y - 7, 8, 2, kind.hat);
      if (masked && !drawSprite('masker', 0, x + 4, y + 1)) rect(x + 1, y - 3, 6, 2, C.white);
    }
    if (S.panic > 30) rect(x + (o.dir > 0 ? 9 : -3), y - 3 + run, 2, 2, C.water);   // keringat
    if (o.bubble > 0) drawSpeechBubble(o.text, x + 4, y - 24);
  });
}


// ---------- Matahari ----------
function drawSun(x, y, r) {
  // cahaya pendar di langit
  const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 5);
  glow.addColorStop(0, 'rgba(255, 224, 160, 0.6)');
  glow.addColorStop(0.4, 'rgba(255, 190, 120, 0.25)');
  glow.addColorStop(1, 'rgba(255, 160, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  if (drawSprite('matahari', 0, x, y + ASSETS.matahari.height / 2)) return;
  circle(x, y, r + 3, '#f8b878');
  circle(x, y, r, '#fce8b0');
  // garis kabut yang lewat di depan matahari
  rect(x - r, y + 4, r * 2, 1, '#f0b888');
  rect(x - r + 3, y + 9, r * 2 - 6, 1, '#f0b888');
  rect(x - r + 2, y - 6, r * 2 - 4, 1, '#f8d8a0');
}

// ---------- Helikopter polisi ----------
function drawHelicopter(x, y, flip, withBeam) {
  if (withBeam) {   // lampu sorot menyapu ke bawah
    const sweep = Math.sin(time * 1.3 + x * 0.01) * 0.45;
    ctx.save();
    ctx.translate(x, y + 3);
    ctx.rotate(sweep);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#fff6c0';
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(18, 120); ctx.lineTo(-18, 120); ctx.fill();
    ctx.restore();
  }
  const frame = Math.floor(time * 20) % 2;
  if (drawSprite('helikopter', frame, x, y + 9, flip)) return;
  facing(x, y, flip, () => {
    if (frame === 0) rect(-15, -9, 30, 1, C.black); else rect(-8, -9, 16, 1, C.black);   // baling-baling
    rect(0, -8, 1, 2, C.black);
    rect(-17, -4, 10, 2, C.navy);                          // ekor
    rect(-19, -7, 2, 5, C.navy);
    rect(-20, frame ? -8 : -5, 1, 4, C.black);             // baling-baling ekor
    box(-7, -6, 14, 8, C.navy);                            // badan
    rect(-6, -2, 12, 1, C.white);                          // garis putih
    rect(3, -5, 4, 3, C.water);                            // kaca kokpit
    rect(-6, 3, 12, 1, C.black);                           // kaki pendarat
    rect(-4, 2, 1, 1, C.black); rect(3, 2, 1, 1, C.black);
    rect(-1, -7, 2, 1, blink(0.4) ? C.red : C.blue);       // lampu sirene
  });
}

function drawHelicopters(cam) {
  S.helis.forEach(h => {
    const y = h.y - cam;
    if (y < 30 || y > H + 20) return;
    drawHelicopter(h.x, y, h.vx < 0, true);
  });
}

// ---------- Satwa ----------
// Semua satwa digambar menghadap kanan; flip = menghadap kiri
function facing(x, y, flip, drawFn) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  drawFn();
  ctx.restore();
}

function drawOrangutan(x, bottom, frame, flip) {
  if (drawSprite('orangutan', frame, x, bottom, flip)) return;
  const arm = frame % 2;
  facing(x, bottom, flip, () => {
    rect(-6, -9 + arm, 2, 9 - arm, C.furDark);        // lengan panjang
    rect(4, -9 + (1 - arm), 2, 9 - (1 - arm), C.furDark);
    rect(-4, -9, 8, 6, C.furDark);                    // badan
    rect(-3, -9, 6, 5, C.fur);
    rect(-3, -3, 2, 3, C.furDark); rect(1, -3, 2, 3, C.furDark);   // kaki
    rect(-2, -14, 6, 5, C.fur);                       // kepala
    rect(-1, -13, 4, 3, C.apeFace);
    rect(0, -12, 1, 1, C.black); rect(2, -12, 1, 1, C.black);
  });
}

function drawSunBear(x, bottom, frame, flip) {
  if (drawSprite('beruang', frame, x, bottom, flip)) return;
  const step = frame % 2;
  facing(x, bottom, flip, () => {
    rect(-6, -2, 2, 2 + step, C.bear); rect(-2, -2, 2, 2 + (1 - step), C.bear);   // kaki
    rect(2, -2, 2, 2 + step, C.bear);
    rect(-7, -8, 12, 6, C.bear);                      // badan
    rect(3, -10, 6, 6, C.bear);                       // kepala
    rect(8, -7, 2, 2, C.bearMuzzle);                  // moncong
    rect(6, -9, 1, 1, C.white);                       // mata
    rect(3, -11, 2, 1, C.bear); rect(7, -11, 2, 1, C.bear);   // telinga
    rect(1, -5, 4, 2, C.bearChest);                   // tanda bulan sabit di dada
  });
}

function drawHornbill(x, y, frame, flip) {
  if (drawSprite('enggang', frame, x, y + 4, flip)) return;
  const up = frame % 2 === 0;
  facing(x, y, flip, () => {
    rect(-8, -1, 4, 2, C.white);                      // ekor putih
    rect(-4, -1, 8, 3, C.black);                      // badan
    rect(-3, 1, 5, 1, C.white);
    rect(3, -3, 3, 3, C.black);                       // kepala
    rect(5, -2, 1, 1, C.white);
    rect(6, -2, 4, 2, C.beak);                        // paruh besar
    rect(5, -4, 4, 1, C.casque);                      // tanduk merah
    if (up) { rect(-2, -5, 5, 4, C.black); rect(-2, -5, 5, 1, C.white); }
    else    { rect(-2, 2, 5, 3, C.black); rect(-2, 4, 5, 1, C.white); }
  });
}

function drawCrow(x, y, frame, flip) {
  if (drawSprite('gagak', frame, x, y + 2, flip)) return;
  facing(x, y, flip, () => {
    rect(-2, -1, 4, 2, C.black);
    rect(2, -2, 2, 2, C.black);
    rect(4, -1, 1, 1, C.grey);
    if (frame % 2 === 0) rect(-1, -3, 3, 2, C.black); else rect(-1, 1, 3, 2, C.black);
  });
}

function drawBirds(cam) {
  S.birds.forEach(b => {
    const y = b.y - cam;
    if (y < 30 || y > H + 10) return;
    const frame = Math.floor(time * (b.type === 'crow' ? 10 : 5) + b.seed) % 2;
    if (b.type === 'hornbill') drawHornbill(b.x, y, frame, b.vx < 0);
    else drawCrow(b.x, y, frame, b.vx < 0);
  });
}

function drawAnimals(cam) {
  const g = -cam;
  if (g > H + 40) return;
  S.animals.forEach((a, i) => {
    const frame = Math.floor(time * 4 + i) % 2;
    if (a.type === 'bear') drawSunBear(a.x, g + 52, frame, a.dir < 0);
    else drawOrangutan(a.x, g - 25, frame, a.dir < 0);
  });
}

// ---------- Puing & mobil hangus ----------
function drawRubble(x, bottom) {
  rect(x, bottom - 3, 18, 3, C.pavementDark);
  rect(x + 3, bottom - 6, 9, 3, C.grey);
  rect(x + 6, bottom - 8, 4, 2, C.pavementDark);
  rect(x + 12, bottom - 4, 3, 1, C.crack);
  rect(x + 1, bottom - 5, 2, 1, C.rust);
}

function drawWreck(x, y, dir, color) {
  const body = mixColor(color, '#2a2020', 0.55);
  box(x - 9, y - 5, 18, 6, body);
  box(x - 5 + dir, y - 9, 10, 5, body);
  rect(x - 3 + dir * 2, y - 8, 6, 3, C.crack);          // kaca pecah
  rect(x - 2 + dir * 2, y - 8, 1, 1, C.grey);
  rect(x - 7, y + 1, 4, 2, C.black);                    // ban kempes
  rect(x + 3, y + 1, 4, 2, C.black);
  rect(x - 8, y - 3, 3, 1, C.rust); rect(x + 4, y - 2, 3, 1, C.rust);
  ctx.globalAlpha = 0.45;
  for (let k = 0; k < 3; k++) {
    const age = (time * 7 + k * 10 + x) % 30;
    drawPuff(x + dir * 3 + age * 0.2, y - 10 - age, 1.5 + age * 0.08, C.grey);
  }
  ctx.globalAlpha = 1;
}

// ---------- Gelembung dukungan ----------
function drawBubbles(cam) {
  S.bubbles.forEach(b => {
    const x = b.x, y = b.y - cam;
    if (y < 44 || y > H + 10) return;
    if (drawSprite('gelembung', 0, x, y + 7)) return;
    ctx.globalAlpha = 0.35;
    circle(x, y, 7, C.white);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.white; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
    // hati kecil
    rect(x - 3, y - 2, 2, 2, C.red); rect(x + 1, y - 2, 2, 2, C.red);
    rect(x - 3, y, 6, 1, C.red); rect(x - 2, y + 1, 4, 1, C.red); rect(x - 1, y + 2, 2, 1, C.red);
    rect(x - 4, y - 5, 2, 1, C.white);   // kilau
  });
}

// ---------- Teks yang dibungkus ke beberapa baris ----------
function wrapText(str, maxWidth, size) {
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (line && textWidth(test, size) > maxWidth) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Pesan dukungan saat mengambil gelembung
function drawCheer() {
  if (!S.cheer) return;
  ctx.globalAlpha = Math.min(1, S.cheer.t * 2);
  box(6, 64, W - 12, 26, C.white);
  text('SUARA RAKYAT MENDUKUNGMU!', W / 2, 68, C.red, 'center', null, 6);
  text(S.cheer.text, W / 2, 79, C.black, 'center', null, 6);
  ctx.globalAlpha = 1;
}

// Kotak info ISPA di bawah layar
// Kotak info ISPA / berita di bawah layar (game tetap berjalan)
function drawInfo() {
  if (!S.info) return;
  const f = S.info.fact;
  const color = f.label === 'BERITA' ? C.yellow : C.orange;
  const lines = wrapText(f.text, W - 20, 6);
  const h = 22 + lines.length * 8;
  const y = H - h - 4;
  const fade = Math.min(1, S.info.t * 2, (INFO_DURATION - S.info.t) * 4);
  ctx.globalAlpha = fade * 0.88;
  rect(4, y, W - 8, h, C.black);
  ctx.globalAlpha = fade;
  rect(4, y, 3, h, color);
  text(f.label, 11, y + 4, color, 'left', null, 6);
  lines.forEach((l, i) => text(l, 11, y + 13 + i * 8, C.white, 'left', null, 6));
  text('Sumber: ' + f.source, 11, y + h - 8, C.grey, 'left', null, 5);
  ctx.globalAlpha = 1;
}

function drawMessage() {
  const m = S.message;
  if (!m) return;
  const size = 6, lineH = 8, pad = 8, boxW = W - 16;
  const color = m.label === 'BERITA' ? C.yellow : m.label === 'INFO ISPA' ? C.orange : C.grass;

  // susun semua baris
  const body = [];
  (m.lines || [m.text]).forEach(l => wrapText(l, boxW - pad * 2, size).forEach(w => body.push(w)));
  const goal = m.goal ? wrapText(m.goal, boxW - pad * 2, size) : [];
  const h = pad + 10 + body.length * lineH + (goal.length ? 6 + goal.length * lineH : 0) + (m.source ? 12 : 0) + 18;
  const x = 8, y = Math.round((H - h) / 2);

  ctx.globalAlpha = 0.55; rect(0, 0, W, H, C.black); ctx.globalAlpha = 1;
  box(x, y, boxW, h, '#14121a');
  rect(x + 1, y + 1, boxW - 2, 2, color);
  text(m.label, x + pad, y + pad, color, 'left', null, size);
  let ty = y + pad + 12;
  body.forEach(l => { text(l, x + pad, ty, C.white, 'left', null, size); ty += lineH; });
  if (goal.length) {
    ty += 6;
    goal.forEach(l => { text(l, x + pad, ty, C.yellow, 'left', null, size); ty += lineH; });
  }
  if (m.source) text('Sumber: ' + m.source, x + pad, ty + 3, C.grey, 'left', null, 5);
  if (blink(1)) text('TEKAN START', W / 2, y + h - 12, C.white, 'center', null, size);
}


/* =====================================================================
   10. HUD, TITLE SCREEN, LAYAR AKHIR
   ===================================================================== */
function clockText() {
  const minutes = 330 + Math.floor(S.playTime);   // mulai 05:30, 1 detik = 1 menit
  return String(Math.floor(minutes / 60) % 24).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
}

function drawHUD() {
  rect(0, 0, W, HUD_H, C.black);

  // Kolom: label (kiri) | bar (tengah) | ikon + angka (kanan)
  const BAR_X = 54;                 // semua bar mulai di x yang sama
  const ICON_X = W - 44;            // kolom ikon
  const NUM_X = ICON_X + 13;        // kolom angka
  const BAR_W = ICON_X - 6 - BAR_X; // semua bar sama panjang

  // baris 1: jam, fase, ketinggian
  text(clockText(), 3, 3, C.white);
  text('F' + (S.phase + 1), BAR_X + BAR_W / 2, 3, S.phase >= PHASE.DRONE ? C.red : C.yellow, 'center');
  text(meters(S.y) + 'M', W - 3, 3, C.grass, 'right');

  // baris 2: panik + jumlah spanduk
  text('PANIK', 3, 13, C.red);
  drawBar(BAR_X, 13, BAR_W, S.panic / 100, S.panic > 70 && blink(0.3) ? C.yellow : C.red);
  if (!drawSpriteBox('ikon_spanduk', 0, ICON_X, 14)) { rect(ICON_X, 14, 10, 7, C.yellow); rect(ICON_X + 1, 15, 8, 1, C.black); }
  text(String(S.placed), NUM_X, 13, C.yellow);

  // baris 3: tenaga (kuning saat didukung) + amunisi poster (merah berkedip kalau habis)
  const low = S.tired || S.inSmoke;
  const buffed = S.buff > 0;
  text('TENAGA', 3, 23, buffed ? C.yellow : S.tired ? C.red : C.water);
  drawBar(BAR_X, 23, BAR_W, S.stamina / 100, buffed ? (blink(0.2) ? C.yellow : C.white) : low ? C.red : C.water);
  if (!drawSpriteBox('ikon_poster', 0, ICON_X + 2, 23)) { rect(ICON_X + 2, 23, 6, 8, C.white); rect(ICON_X + 3, 24, 4, 2, C.blue); }
  const ammoColor = S.ammo === 0 && (S.emptyFlash > 0 ? blink(0.15) : true) ? C.red : C.white;
  text(String(S.ammo), NUM_X, 23, ammoColor);

  // baris 4: nafas (berkurang di dalam asap)
  const weak = S.breath < 30;
  text('NAFAS', 3, 33, weak ? C.red : C.breath);
  drawBar(BAR_X, 33, BAR_W, S.breath / 100, weak && blink(0.3) ? C.red : C.breath);
  if (S.buff > 0) text(Math.ceil(S.buff) + 'D', NUM_X, 33, C.yellow);

  // pengeras suara
  if (S.megaphone) { box(4, HUD_H + 4, W - 8, 13, C.white); text('> ' + S.megaphone.text, 8, HUD_H + 7, C.black); }

  // pengumuman fase
  if (S.phaseBanner > 0 && time % 0.4 < 0.3) {
    box(6, 110, W - 12, 36, C.black);
    text('FASE ' + (S.phase + 1), W / 2, 117, C.yellow, 'center');
    text(PHASES[S.phase].name, W / 2, 131, C.white, 'center');
  }
}

const HUD_H = 42;   // tinggi HUD (4 baris)

// Bar isi 0..1, tingginya pas dengan huruf 8 piksel
function drawBar(x, y, w, fraction, color) {
  rect(x, y, w, 7, C.white);
  rect(x + 1, y + 1, Math.round((w - 2) * Math.max(0, Math.min(1, fraction))), 5, color);
}

function drawTitle() {
  if (drawSpriteBox('title_bg', 0, 0, 0, W, H)) { drawTitleText(); return; }

  const cx = W / 2;        // tengah layar
  const street = 196;      // garis trotoar

  // langit merah berdebu
  rect(0, 0, W, H, '#a8503a');
  rect(0, 120, W, 80, '#c8744a');
  drawCloud(14, 58, true);
  drawCloud(W - 42, 44, true);

  // helikopter polisi sesekali lewat
  const heliX = (time * 22) % (W + 260) - 40;
  if (heliX < W + 40) drawHelicopter(heliX, 112, false, false);

  // burung enggang & gagak terbang melintas
  drawHornbill((time * 18) % (W + 40) - 20, 92 + Math.sin(time * 2) * 3, Math.floor(time * 5) % 2, false);
  for (let i = 0; i < 4; i++) {
    drawCrow(W + 20 - (time * 26 + i * 10) % (W + 60), 74 + (i % 2) * 5, Math.floor(time * 10 + i) % 2, true);
  }

  // gedung-gedung kota memenuhi layar
  drawMonas(W - 28, street - 20);
  drawBuildings(BUILDINGS_FAR, street - 14, C.buildingFar, C.buildingFarWindow, false, 'skyline_jauh');
  drawSun(W * 0.74, 82, 16);
  drawBuildings(BUILDINGS_NEAR, street, C.buildingNear, C.buildingNearWindow, true, 'skyline_dekat');

  // trotoar retak
  rect(0, street, W, 7, C.pavement);
  for (let x = 0; x < W; x += 8) rect(x, street, 1, 7, C.pavementDark);
  for (let x = 10; x < W; x += 31) rect(x, street + 1, 1, 5, C.crack);
  rect(0, street + 7, W, 1, C.black);

  // jalan raya rusak
  rect(0, street + 8, W, H - street, C.asphalt);
  for (let x = 0; x < W; x += 16) if ((x / 16) % 3 !== 1) rect(x, street + 55, 8, 1, C.lane);
  for (let x = 6; x < W; x += 41) { rect(x, street + 44, 7, 1, C.crack); rect(x + 6, street + 45, 5, 1, C.crack); }
  drawRubble(2, street + 6);
  drawRubble(W - 20, street + 6);

  // bundaran dengan tanah di tengah
  ctx.fillStyle = C.pavement;
  ctx.beginPath(); ctx.ellipse(cx, street + 26, 50, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.soil;
  ctx.beginPath(); ctx.ellipse(cx, street + 26, 44, 12, 0, 0, Math.PI * 2); ctx.fill();

  // patung dengan 3 spanduk
  box(cx - 6, 64, 12, street + 18 - 64, C.stone);
  box(cx - 12, street + 16, 24, 9, C.stone);
  [[cx + 6, 78, 0], [cx - 36, 110, 1], [cx + 6, 142, 2]].forEach(([x, y, color]) => {
    if (!drawSpriteBox('spanduk', color, x, y, 30, 24)) box(x, y, 30, 20, C.yellow);
  });

  // pemanjat & polisi di bundaran
  const px = cx - 28, ox = cx + 28;
  if (!drawSprite('player', 0, px, street + 34)) {
    box(px - 4, street + 19, 9, 10, C.grassDark); rect(px - 3, street + 14, 7, 4, C.skin); box(px - 4, street + 10, 9, 5, C.yellow);
    rect(px - 2, street + 29, 2, 4, C.blue); rect(px + 2, street + 29, 2, 4, C.blue);
  }
  if (!drawSprite('petugas_polisi', 0, ox, street + 34, true)) {
    box(ox - 4, street + 22, 8, 10, C.khaki); rect(ox - 3, street + 17, 6, 4, C.skin); rect(ox - 4, street + 15, 8, 2, C.navy);
    rect(ox - 3, street + 32, 2, 2, C.navy); rect(ox + 1, street + 32, 2, 2, C.navy);
  }

  // mobil hangus terbengkalai
  drawWreck(18, street + 50, 1, C.red);
  drawWreck(W - 22, street + 68, -1, C.blue);
  drawWreck(cx + 44, street + 50, -1, C.yellow);

  // satwa yang terusir dari hutan
  drawOrangutan(10, street + 4, 0, false);
  drawOrangutan(W - 12, street + 4, Math.floor(time * 2) % 2, true);
  const bearX = cx - 40 + Math.sin(time * 0.6) * 18;
  drawSunBear(bearX, street + 72, Math.floor(time * 4) % 2, Math.cos(time * 0.6) < 0);

  // easter egg
  if (easterTimer > 0) {
    drawSpeechBubble('HIDUP J*K*WI!', ox, street + 2);
    if (blink(0.3)) { text('!', 10, street - 22, C.white, 'center', C.black); text('!', W - 12, street - 22, C.white, 'center', C.black); }
  }
  drawTitleText();
}


function drawTitleText() {
  if (!drawSprite('logo', 0, W / 2, 46)) {
    text(GAME_NAME, W / 2, 14, C.yellow, 'center', C.black, 16);
  }
  if (blink(1.2)) {
    box(W / 2 - 50, H - 22, 100, 15, C.black);
    text('TEKAN START', W / 2, H - 18, C.white, 'center');
  }
}

function drawEndScreen() {
  const reveal = Math.min(1, S.endTimer / 0.8);
  rect(0, 0, W, Math.round(H * reveal), C.black);
  if (reveal < 1) return;

  if (S.endReason === 'ispa') {
    text('PINGSAN', W / 2, 22, C.red, 'center');
    text('nafasmu habis karena asap,', W / 2, 42, C.grass, 'center', null, 6);
    text('seperti 174.694 warga yang', W / 2, 52, C.grass, 'center', null, 6);
    text('kena ISPA akibat karhutla', W / 2, 62, C.grass, 'center', null, 6);
    text('(Kemenkes, Agu-Sep 2026)', W / 2, 72, C.grey, 'center', null, 5);
  } else {
    text('DITURUNKAN', W / 2, 22, C.red, 'center');
    text('"diberi penanganan', W / 2, 42, C.grass, 'center');
    text('medis, bukan', W / 2, 54, C.grass, 'center');
    text('ditangkap"', W / 2, 66, C.grass, 'center');
  }

  const minutes = Math.floor(S.playTime / 60), seconds = Math.floor(S.playTime) % 60;
  const rows = [
    ['bertahan', minutes + 'j ' + seconds + 'm'],
    ['tinggi max', S.maxHeight + 'M'],
    ['spanduk', S.placed],
    ['dicopot', S.ripped],
    ['poster', S.thrown],
    ['drone ketutup', S.downed],
    ['dukungan', S.supports],
    ['fase', S.phase + 1],
  ];
  rows.forEach(([label, value], i) => {
    text(label, 10, 86 + i * 12, C.white);
    text(String(value), W - 10, 86 + i * 12, C.yellow, 'right');
  });

  text('SKOR ' + S.score, W / 2, 188, C.yellow, 'center');
  if (S.newRecord) {
    if (blink(0.5)) text('REKOR BARU!', W / 2, 200, C.orange, 'center');
  } else {
    text('rekor ' + S.best, W / 2, 200, C.grey, 'center');
  }
  text('spanduk turun,', W / 2, 216, C.pink, 'center');
  text('hutan masih', W / 2, 226, C.pink, 'center');
  text('terbakar.', W / 2, 236, C.pink, 'center');

  // tombol tutup muncul setelah jeda singkat supaya tidak tertutup tak sengaja
  if (S.endTimer > 1.5) {
    box(22, 252, W - 44, 26, C.white);
    text('TUTUP', W / 2, 256, C.black, 'center');
    text('START / A', W / 2, 268, C.grey, 'center', null, 6);
  }
}


/* =====================================================================
   11. LOOP UTAMA
   ===================================================================== */
function draw() {
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  if (scene === 'title') { drawTitle(); return; }

  const cam = S.camera + (S.shake > 0 ? Math.round(Math.random() * 4 - 2) : 0);
  drawBackground(cam);
  drawBirds(cam);
  drawGround(cam);
  drawPillar(cam);
  drawBanners(cam);
  drawHeightMarkers(cam);
  drawPickups(cam);
  drawWaterJets(cam);
  drawLifts(cam);
  drawPlayer(cam);
  drawHelicopters(cam);
  drawDrones(cam);
  drawPosters(cam);
  drawSmokes(cam);
  drawAnimals(cam);
  drawOfficers(cam);
  drawBubbles(cam);

  if (S.inSmoke) {
    ctx.globalAlpha = 0.5; rect(0, 0, W, H, C.grey); ctx.globalAlpha = 1;
    if (blink(0.8)) text('UHUK!', playerX(S.side), S.y - cam - 24, C.white, 'center', C.black);
  }
  if (S.breath < 30 && blink(0.6)) {   // layar memerah saat nafas hampir habis
    ctx.globalAlpha = 0.18; rect(0, 0, W, H, C.red); ctx.globalAlpha = 1;
  }
  drawHUD();
  drawCheer();
  drawInfo();
  drawMessage();
  if (S.paused && !S.message) drawPauseScreen();
  if (scene === 'end') drawEndScreen();
}

function drawPauseScreen() {
  ctx.globalAlpha = 0.6; rect(0, HUD_H, W, H - HUD_H, C.black); ctx.globalAlpha = 1;
  box(20, 120, W - 40, 40, C.black);
  text('JEDA', W / 2, 128, C.yellow, 'center');
  text('tekan START', W / 2, 144, C.white, 'center');
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Tunggu font & aset (maksimal 2 detik), lalu mulai
newGame();
Promise.race([
  Promise.all([document.fonts.ready, loadAssets()]),
  new Promise(r => setTimeout(r, 2000)),
]).then(() => requestAnimationFrame(loop));
