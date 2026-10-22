# SUA

Game HTML portrait bergaya pixel, terinspirasi dari aksi Greenpeace Indonesia di Bundaran HI pada 20 Oktober 2026. Kota sudah hancur karena keserakahan, satwa yang terusir dari hutan berkeliaran di jalan. Pemain memanjat tiang di tengah kota, memasang spanduk, dan menghindari skylift, kabut asap, meriam air, serta drone.

## Isi folder

```
sua/
├── index.html   bentuk konsol: layar & tombol
├── style.css    warna & ukuran konsol
├── aset.js      DAFTAR ASET: file yang kamu edit untuk ganti gambar
├── audio.js     musik 8-bit & efek suara (dibuat langsung oleh browser)
├── game.js      semua logika & gambar pixel bawaan
└── aset/        taruh PNG kamu di sini
```

## Tombol

| Tombol | Fungsi | Keyboard |
|---|---|---|
| D-pad | Naik, turun, pindah sisi tiang | Panah |
| A | Tahan untuk pasang spanduk | Z / Spasi |
| B | Tahan untuk lempar poster (otomatis mengincar drone atau skylift terdekat) | X |
| START | Mulai game, jeda, lanjut | Enter / P |
| SELECT | Ganti warna layar (normal / hijau dot-matrix) | Shift |
| Lubang speaker | Bisukan / nyalakan suara | M |

Tampilan konsol menyesuaikan ukuran layar HP secara otomatis. Tinggi dunia game selalu 288 piksel, sedangkan lebarnya 160–240 piksel mengikuti bentuk layar, sehingga layar selalu penuh tanpa sisi kosong. Warna badan konsol, tombol, dan tulisan bisa diubah di bagian paling atas `style.css`.

## Tombol donasi

Tombol **♥ DONASI** di kanan bawah layar membuka halaman donasi Greenpeace Indonesia di tab baru. Alamatnya ada di `index.html`, di elemen `<a class="donate">`. Ganti nilai `href` kalau mau memakai alamat lain.

## Menjalankan di VS Code

1. Buka folder `sua` di VS Code.
2. Pasang ekstensi **Live Server** (dari Ritwick Dey).
3. Klik kanan `index.html`, pilih **Open with Live Server**.

Untuk mencoba di HP: pastikan HP dan laptop di Wi-Fi yang sama, lalu buka alamat Live Server di browser HP dengan IP laptop, misalnya `http://192.168.1.5:5500`.

Setiap kali kamu menyimpan file, browser otomatis refresh. Membuka `index.html` langsung dengan klik dua kali juga bisa, tapi Live Server lebih praktis.

## Mengganti aset

Contoh mengganti gambar pemain:

1. Simpan PNG-mu sebagai `aset/player.png`.
2. Buka `aset.js`, cari baris `player`, lalu isi nama file-nya:

   ```js
   player: { file: 'player.png', frames: 6, width: 16, height: 24 },
   ```

3. Simpan. Pemain sekarang memakai gambarmu.

Kalau `file` dikosongkan (`''`), game kembali memakai gambar pixel bawaan. Jadi kamu bisa mengganti aset satu per satu.

### Arti pengaturan

| Pengaturan | Arti |
|---|---|
| `file` | Nama PNG di folder `aset/`. |
| `frames` | Jumlah frame yang dijejer **ke samping** dalam satu PNG. Gambar dipotong sama rata. |
| `width`, `height` | Ukuran **satu frame** saat tampil di game. Layar game berukuran 160 × 288. |
| `fill` | Khusus latar (`hutan`, `skyline_jauh`, `skyline_dekat`): warna untuk mengisi area di bawah gambar. |

### Tips

- **Sprite sheet.** Untuk animasi, jejerkan frame ke samping. Contoh `player.png` dengan 6 frame 48×72 berarti ukuran file-nya 288×72. Urutan frame setiap aset tertulis di komentar `aset.js`.
- **Resolusi bebas.** PNG boleh lebih besar dari `width`/`height` (misalnya 3× lipat), nanti otomatis dikecilkan. Yang penting perbandingan lebar:tinggi frame sama dengan `width`:`height`, supaya gambar tidak gepeng.
- **Arah hadap.** Gambar karakter menghadap kanan. Game membaliknya sendiri saat perlu.
- **Pixel art atau ilustrasi.** Di bagian atas `aset.js`, set `PIXEL_ART_ASSETS = true` untuk gambar pixel art (tetap kotak-kotak tajam), atau `false` untuk gambar ilustrasi halus.
- **Lebar layar.** Aset yang selebar layar (`tanah`, `jalan`, `rumput`) ditarik mengikuti lebar layar. `hutan`, `skyline_jauh`, dan `skyline_dekat` diulang ke samping, jadi sebaiknya ujung kiri dan kanannya bisa disambung.
- **Variasi.** `spanduk`, `poster`, dan `asap` memakai tiap frame sebagai variasi. Contohnya 5 frame spanduk berarti 5 warna yang dipakai bergantian.
- **Gambar tidak muncul?** Tekan F12, buka tab **Console**. Kalau nama file salah, akan muncul pesan `Aset "..." tidak ditemukan`.

## Poster sebagai amunisi

- Mulai dengan **5 poster**.
- **+1** setiap berhasil memasang spanduk.
- **+2** setiap melewati poster kuning yang menempel di tiang.
- Poster yang dilempar otomatis mengincar **drone** (jatuh) atau **keranjang skylift** (petugasnya buta sebentar dan berhenti mengejar).
- Kalau amunisi habis, angka di HUD berkedip merah.

Jumlahnya diatur di bagian 5 `game.js`: `POSTER_START`, `POSTER_PER_BANNER`, `POSTER_PER_PICKUP`, `PICKUP_GAP_MIN/MAX` (jarak antar poster di tiang), dan `POSTER_RANGE` (jarak bidik).

## Nafas, asap & info ISPA

- Bar **NAFAS** berkurang selama pemain berada di dalam asap, dan pulih pelan di luar asap. Kalau habis, pemain **pingsan** dan permainan berakhir.
- Setiap kali gumpalan asap datang, kotak info muncul di bawah layar selama 12 detik lalu menutup sendiri (pemain tidak perlu menyentuh asapnya). Isinya bergantian antara **INFO ISPA** (data ISPA akibat karhutla 2026) dan **BERITA** (masalah lain di Indonesia: guru honorer, keracunan MBG, PHK), masing-masing dengan sumbernya.
- Semua isinya ada di `INFO_FEED` bagian 5 `game.js` (data per 22 Oktober 2026). Tambah, hapus, atau perbarui beritanya di sana. Lama tampilnya diatur di `INFO_DURATION`.
- Kekuatan asap diatur lewat `SMOKE_DAMAGE` dan `BREATH_RECOVER`.

## Gelembung dukungan

Gelembung berisi hati melayang lewat sesekali. Kalau disentuh, muncul pesan **SUARA RAKYAT MENDUKUNGMU!** dan tenaga tidak berkurang selama 3 detik. Pesan-pesannya ada di `SUPPORT_MESSAGES`, lama buff di `BUFF_TIME`, dan seberapa sering muncul di `BUBBLE_GAP_MIN/MAX`.

## Helikopter polisi & matahari

Mulai fase polisi, helikopter polisi lewat setiap 14–24 detik dengan lampu sorot yang menyapu ke bawah dan pesan dari pengeras suara. Helikopter ini hanya hiasan dan tidak menangkap pemain. Jaraknya diatur di `HELI_GAP_MIN/MAX`. Matahari tampil bersinar menembus kabut di belakang gedung. Keduanya punya slot aset (`helikopter`, `matahari`).

## Satwa

Orangutan dan beruang madu berkeliaran di jalanan, sementara burung enggang dan kawanan gagak terbang melintas. Semuanya punya slot aset sendiri di `aset.js` (`orangutan`, `beruang`, `enggang`, `gagak`).

## Musik & suara

Semua musik dan efek suara dibuat langsung oleh browser memakai gelombang kotak, segitiga, dan noise seperti chip konsol 8-bit, jadi tidak ada file audio. Suara baru mulai setelah pemain menekan tombol pertama kali (aturan browser).

Di `audio.js`:

- **Volume** ada di bagian 1 (`VOLUME_MUSIC`, `VOLUME_SFX`).
- **Lagu** ada di bagian 2. Tiap baris adalah satu birama berisi 16 ketukan: tulis nada seperti `C5`, `F#4`, pakai `-` untuk menahan nada dan `.` untuk diam. Drum memakai huruf `k` (kick), `s` (snare), `h` (hi-hat).
- **Efek suara** ada di bagian 3. Tiap efek adalah rangkaian nada pendek yang bisa diubah tinggi nada dan panjangnya.

Musik permainan makin cepat tiap fase dan makin tinggi kamu memanjat. Mulai fase damkar muncul lapisan arpeggio tambahan.

## Mengubah permainan

- `GAME_NAME` dan `CREDIT_TEXT`: nama game dan keterangan inspirasi di title screen. Nama di badan konsol dan judul tab ada di `index.html`.

Semua angka dan teks permainan ada di **bagian 5** `game.js` (`PENGATURAN GAME`):

- `CLIMB_SPEED`, `HANG_TIME`, `POSTER_COOLDOWN`: kecepatan dan waktu.
- `BANNER_TEXT`: tulisan di spanduk.
- `PHASES`: kapan tiap fase muncul (`t` = detik, `b` = jumlah spanduk, `m` = ketinggian dalam meter; mana yang tercapai duluan) dan teriakan petugas.
- `DANGER_PER_METER`, `THIN_AIR_PER_METER`: seberapa cepat game makin susah saat makin tinggi. Skylift, drone, semprotan, dan asap makin ganas, jumlah drone bertambah tiap 150 m, dan tenaga lebih cepat habis.
- `BANNER_PADDING`, `BANNER_TOP_SPACE`: jarak tulisan dari tepi spanduk. Ukuran huruf spanduk mengecil otomatis supaya selalu muat, jadi teks di `BANNER_TEXT` boleh panjang atau lebih dari 3 baris.
- `MEGAPHONE`, `HEIGHT_MARKERS`: pesan pengeras suara dan penanda ketinggian.

`game.js` dibagi menjadi 11 bagian bernomor. Daftar isinya ada di bagian paling atas file.
