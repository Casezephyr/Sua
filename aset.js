/* =====================================================================
   DAFTAR ASET  —  file ini yang kamu edit untuk ganti gambar
   =====================================================================

   CARA GANTI ASET
   1. Taruh file PNG di folder  aset/
   2. Cari nama asetnya di bawah, lalu isi  file:  dengan nama PNG-nya.
        contoh:  player: { file: 'player.png', ... }
   3. Simpan, lalu refresh browser.
   Kalau  file  dibiarkan kosong (''), game memakai gambar pixel bawaan.

   ARTI SETIAP PENGATURAN
   file    : nama file PNG di folder aset/
   frames  : jumlah frame yang dijejer KE SAMPING dalam satu PNG.
             PNG otomatis dipotong sama rata sesuai jumlah ini.
   width   : lebar SATU frame saat tampil di game (satuan piksel game).
   height  : tinggi SATU frame saat tampil di game.
             Layar game tingginya 288. Lebarnya 160-240 mengikuti layar HP;
             latar yang lebar (tanah, jalan, hutan) otomatis ditarik/diulang.
             PNG-mu boleh lebih besar (misal 3x lipat), nanti otomatis
             dikecilkan ke ukuran ini. Usahakan perbandingannya sama.
   fill    : (khusus latar) warna untuk mengisi area di bawah gambar.

   Karakter: gambar MENGHADAP KANAN. Game membaliknya sendiri kalau perlu.
   ===================================================================== */

// Folder tempat semua PNG
const ASSET_FOLDER = 'aset/';

// true  = gambarmu pixel art, tampil tajam kotak-kotak
// false = gambarmu ilustrasi halus, tampil lembut saat dikecilkan
const PIXEL_ART_ASSETS = true;

const ASSETS = {

  /* ---------- KARAKTER ---------- */
  // Frame: 0 diam, 1 manjat, 2 manjat, 3 pasang spanduk, 4 pusing, 5 capek
  player:             { file: '', frames: 6, width: 16, height: 24 },

  // Frame: 0 diam, 1 lari, 2 lari
  petugas_satpam:     { file: '', frames: 3, width: 12, height: 20 },
  petugas_polisi:     { file: '', frames: 3, width: 12, height: 20 },
  petugas_damkar:     { file: '', frames: 3, width: 12, height: 20 },
  petugas_unit:       { file: '', frames: 3, width: 12, height: 20 },

  // Ditempel di wajah petugas mulai fase asap
  masker:             { file: '', frames: 1, width: 6,  height: 2 },

  /* ---------- MUSUH & RINTANGAN ---------- */
  skylift_truk_merah:     { file: '', frames: 1, width: 40, height: 16 },
  skylift_truk_biru:      { file: '', frames: 1, width: 40, height: 16 },
  // Frame: 0 normal, 1 ketutup poster
  skylift_keranjang:      { file: '', frames: 2, width: 20, height: 24 },
  skylift_keranjang_biru: { file: '', frames: 2, width: 20, height: 24 },

  // Frame: 0 baling-baling, 1 baling-baling, 2 jatuh
  drone:              { file: '', frames: 3, width: 14, height: 8 },

  // Potongan air yang diulang ke samping. Frame = animasi
  semprotan:          { file: '', frames: 2, width: 8,  height: 10 },
  peringatan:         { file: '', frames: 1, width: 8,  height: 8 },

  // Gumpalan asap. Tiap frame = 1 variasi bentuk (dipilih acak)
  asap:               { file: '', frames: 1, width: 96, height: 48 },

  // Helikopter polisi yang sesekali lewat. Frame: 0-1 baling-baling
  helikopter:         { file: '', frames: 2, width: 40, height: 18 },

  // Dekorasi jalan, muncul mulai fase polisi
  kerucut:            { file: '', frames: 1, width: 8,  height: 10 },
  barikade:           { file: '', frames: 1, width: 22, height: 16 },

  /* ---------- SATWA (terusir dari hutan) ---------- */
  // Frame: 0-1 jalan
  orangutan:          { file: '', frames: 2, width: 14, height: 14 },
  beruang:            { file: '', frames: 2, width: 18, height: 11 },
  // Frame: 0 sayap naik, 1 sayap turun
  enggang:            { file: '', frames: 2, width: 18, height: 10 },
  gagak:              { file: '', frames: 2, width: 7,  height: 6 },

  // Gelembung dukungan masyarakat (tenaga tak terbatas 3 detik)
  gelembung:          { file: '', frames: 1, width: 14, height: 14 },

  /* ---------- SPANDUK & POSTER ---------- */
  // Spanduk kosong, teksnya ditulis oleh game.
  // Tiap frame = 1 warna, dipakai bergantian.
  spanduk:            { file: '', frames: 1, width: 58, height: 48 },
  // Frame = animasi spanduk jatuh
  spanduk_jatuh:      { file: '', frames: 2, width: 58, height: 12 },
  // Tiap frame = 1 desain, dipilih acak setiap lemparan
  poster:             { file: '', frames: 1, width: 8,  height: 10 },
  // Poster yang menempel di tiang (amunisi +2 saat dilewati)
  poster_tiang:       { file: '', frames: 1, width: 9,  height: 11 },

  /* ---------- LINGKUNGAN ---------- */
  tiang:              { file: '', frames: 1, width: 14,  height: 24 },  // diulang ke atas
  alas:               { file: '', frames: 1, width: 52,  height: 22 },
  tanah:              { file: '', frames: 1, width: 160, height: 24 },  // tanah di sekitar alas patung
  jalan:              { file: '', frames: 1, width: 160, height: 60 },
  rumput:             { file: '', frames: 1, width: 160, height: 4 },
  pohon_kecil:        { file: '', frames: 1, width: 10,  height: 18 },
  pohon_besar:        { file: '', frames: 1, width: 14,  height: 24 },
  // Lapisan gedung, diulang ke samping. Bawah gambar = tanah.
  skyline_jauh:       { file: '', frames: 1, width: 160, height: 150, fill: '#9c8cbc' },
  skyline_dekat:      { file: '', frames: 1, width: 160, height: 100, fill: '#3c3c6c' },
  monas:              { file: '', frames: 1, width: 18,  height: 82 },
  matahari:           { file: '', frames: 1, width: 38,  height: 38 },
  awan:               { file: '', frames: 1, width: 16,  height: 9 },
  awan_kabut:         { file: '', frames: 1, width: 16,  height: 9 },
  // Strip hutan di cakrawala, diulang ke samping
  hutan:              { file: '', frames: 1, width: 160, height: 30, fill: '#003000' },
  // Frame = animasi api
  api:                { file: '', frames: 3, width: 12,  height: 12 },
  asap_kecil:         { file: '', frames: 1, width: 8,   height: 8 },

  /* ---------- UI ---------- */
  logo:               { file: '', frames: 1, width: 140, height: 32 },
  title_bg:           { file: '', frames: 1, width: 160, height: 288 },
  ikon_spanduk:       { file: '', frames: 1, width: 10,  height: 7 },
  ikon_poster:        { file: '', frames: 1, width: 6,   height: 8 },
  bintang_pusing:     { file: '', frames: 2, width: 8,   height: 8 },
  keringat:           { file: '', frames: 1, width: 2,   height: 3 },
};
