# Waktu Solat Malaysia

Aplikasi web waktu solat Malaysia dengan paparan harian, jadual bulanan dan panduan kiblat. Susun atur desktop menggunakan navigasi sisi; pada telefon, navigasi bawah memudahkan pertukaran paparan.

**[Buka aplikasi](https://waktu-solat-two.vercel.app/)** · [Repository GitHub](https://github.com/aafham/Waktu-Solat)

## Ciri utama

- Waktu Subuh, Syuruk, Zohor, Asar, Maghrib dan Isyak, dengan kiraan masa ke solat fardu seterusnya.
- Tarikh dan pengiraan waktu menggunakan `Asia/Kuala_Lumpur`, termasuk apabila peranti berada dalam zon masa lain. Syuruk dipaparkan sebagai waktu matahari terbit dan dikecualikan daripada solat seterusnya.
- Jadual bulanan dengan pilihan bulan, serta tarikh Hijrah daripada data jadual apabila tersedia.
- Pengesanan zon melalui GPS atau dialog carian mengikut negeri, daerah dan kod zon.
- Lokasi kegemaran untuk bertukar zon dengan cepat.
- Tetapan Bahasa Melayu/English, format 12/24 jam dan tema cerah/gelap; pilihan disimpan dalam pelayar.
- Status memuatkan, ralat, sumber data dan penggunaan data tersimpan, dengan pilihan cuba semula.
- Pemasangan PWA dan paparan offline untuk jadual yang sudah dimuatkan.

Pada kunjungan pertama, aplikasi menggunakan **WLY01 — Kuala Lumpur, Putrajaya** sebagai zon lalai dan melabelkannya dengan jelas. Pilih lokasi sendiri atau gunakan GPS untuk mendapatkan zon yang sesuai.

## Cara guna

1. Buka aplikasi dan semak zon yang dipaparkan.
2. Buka pemilih lokasi untuk mencari negeri, daerah atau kod zon, atau gunakan pengesanan GPS dan benarkan akses lokasi.
3. Simpan zon sebagai kegemaran jika mahu menggunakannya semula.
4. Semak waktu hari ini dan kiraan masa; buka jadual bulanan untuk melihat hari lain.
5. Buka panduan kiblat dan aktifkan akses lokasi/sensor apabila diminta.
6. Gunakan tetapan untuk menukar bahasa, format waktu dan tema.

Selepas Isyak, kiraan masa menggunakan waktu Subuh sebenar pada hari berikutnya, termasuk ketika bertukar bulan atau tahun. Jika jadual hari berikutnya belum tersedia, aplikasi tidak meneka waktunya daripada jadual hari ini. Penanda Subuh tamat apabila masuk Syuruk.

## Panduan kiblat

Arah kiblat dikira daripada koordinat semasa sebagai sudut mengikut arah jam dari **utara benar**. Panduan yang bergerak bersama telefon hanya diaktifkan selepas bacaan kompas mutlak yang sah diterima. Bacaan orientasi relatif sahaja tidak mencukupi.

Jika sensor tidak tersedia, kebenaran ditolak atau tiada bacaan diterima, aplikasi memaparkan arah tetap yang dilabelkan dengan jelas. Gunakan rujukan utara untuk membaca arah tetap tersebut. Untuk panduan sensor, letakkan telefon mendatar dan jauhkan daripada gangguan magnet; aplikasi tidak mendakwa sensor telah dikalibrasi.

GPS dan kompas memerlukan HTTPS atau `localhost`, sokongan pelayar/peranti dan kebenaran pengguna. **GPS serta ketepatan sensor pada telefon fizikal belum disahkan.** Ujian automatik meliputi pengiraan arah, kebenaran, bacaan mutlak/relatif dan keadaan sensor tidak tersedia.

## Offline dan pemasangan

Service worker menyimpan fail aplikasi setempat. Jadual disimpan berasingan menggunakan kunci **zon + tahun-bulan**, selepas semua tarikh dan waktu disahkan. Data yang sah digunakan semula selama 24 jam untuk mengurangkan permintaan API; tindakan muat semula data boleh meminta salinan baharu.

Apabila kedua-dua sumber API gagal, hanya jadual lengkap yang sah bagi zon dan bulan yang diminta boleh digunakan daripada simpanan. Simpanan untuk zon lain atau bulan/tahun lain tidak digunakan sebagai ganti. Sambungan internet diperlukan bagi jadual yang belum pernah dimuatkan. Kegunaan offline juga bergantung pada pelayar masih menyimpan data aplikasi.

Untuk memasang aplikasi:

- Gunakan butang/panduan pemasangan dalam aplikasi jika pelayar menyediakannya.
- Chrome atau Edge: buka menu pelayar dan pilih pilihan pemasangan aplikasi yang tersedia.
- Safari pada iPhone/iPad: buka menu kongsi dan pilih **Add to Home Screen**.

Pilihan pemasangan berbeza mengikut pelayar. Aplikasi ini **tidak menyediakan push azan atau peringatan latar belakang** apabila halaman ditutup.

## Jalankan secara lokal

Projek menggunakan HTML, CSS dan JavaScript ES modules tanpa framework atau proses build. Tiada API key, environment variable atau pemasangan dependency diperlukan.

Prasyarat: Git dan Python 3 untuk pelayan fail statik; Node.js 20 atau lebih baharu untuk ujian.

```sh
git clone https://github.com/aafham/Waktu-Solat.git
cd Waktu-Solat
python -m http.server 8000
```

Buka [localhost:8000](http://localhost:8000). Pada Windows, gunakan `py -m http.server 8000` jika arahan `python` tidak tersedia. Gunakan pelayan HTTP, bukan membuka `index.html` terus melalui `file://`, supaya modul dan service worker dapat berfungsi.

Jalankan ujian:

```sh
npm test
```

Ujian menggunakan `node:test` tanpa dependency tambahan. Liputan meliputi zon masa Malaysia, tahun lompat dan pertukaran bulan/tahun, sempadan waktu solat, pengesahan respons/cache, kegagalan API, pengesanan zon GPS serta tingkah laku kompas. Ujian service worker turut menyemak modul offline, pemulihan halaman, pengasingan cache dan ralat storan. Respons API ditiru dalam ujian supaya ujian boleh dijalankan tanpa sambungan internet.

## Struktur fail

| Fail                      | Kegunaan                                                           |
| ------------------------- | ------------------------------------------------------------------ |
| `index.html`              | Struktur halaman, navigasi dan dialog                              |
| `style.css`               | Susun atur desktop/mudah alih, tema dan keadaan interaksi          |
| `script.js`               | Paparan aplikasi, lokasi, kegemaran, jadual dan tetapan            |
| `prayer-data.js`          | API, pengesahan jadual/cache, tarikh Malaysia dan solat seterusnya |
| `zones.js`                | Senarai negeri dan zon untuk carian lokasi                         |
| `qibla.js`                | Pengiraan arah kiblat, kebenaran dan pengendalian sensor           |
| `service-worker.js`       | Cache fail aplikasi setempat dan pemulihan halaman offline         |
| `manifest.json`, `icons/` | Metadata pemasangan dan ikon PWA                                   |
| `tests/`                  | Ujian automatik modul data, kompas dan service worker              |
| `package.json`            | Konfigurasi ES modules dan arahan ujian                            |

## Sumber data dan privasi

Jadual bulanan diminta daripada [JAKIM e-Solat](https://www.e-solat.gov.my/). Jika permintaan gagal, termasuk kerana rangkaian atau CORS, aplikasi mencuba [Waktu Solat API](https://api.waktusolat.app/), yang turut menggunakan data JAKIM. Kedua-dua respons dinormalkan kepada format jadual yang sama sebelum digunakan.

```text
https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone={ZONE}&period=month&year={YEAR}&month={MONTH}
https://api.waktusolat.app/v2/solat/{ZONE}?year={YEAR}&month={MONTH}
https://api.waktusolat.app/zones/{LAT}/{LON}
```

Waktu dalam API JAKIM berupa rentetan masa; endpoint v2 menggunakan saat Unix yang ditukar kepada waktu Malaysia. Butiran endpoint tersedia dalam [dokumentasi Waktu Solat API](https://api.waktusolat.app/docs).

Senarai manual dalam `zones.js` mengandungi **60 zon merentasi 14 kumpulan negeri/wilayah**, disemak terhadap [katalog zon Waktu Solat API](https://api.waktusolat.app/zones) pada **23 September 2026**. Nama daerah dikekalkan daripada respons sumber. Pemetaan yang diperbetulkan termasuk Sarawak, NGS03 (Port Dickson/Seremban), PHG07 (zon khas Rompin), Kelantan dan bahagian Tawau.

Permintaan dibuat terus dari pelayar. Koordinat dihantar ke endpoint pemetaan zon apabila pengguna memilih pengesanan GPS; pengiraan sudut kiblat dibuat pada peranti. Pilihan lokasi, kegemaran, tetapan dan jadual tersimpan kekal dalam storan pelayar dan tidak disegerakkan antara peranti.

## Deployment

Projek boleh dihoskan sebagai laman statik di Vercel dengan preset **Other**, root directory `./` dan tanpa arahan build. URL aplikasi yang digunakan ialah [waktu-solat-two.vercel.app](https://waktu-solat-two.vercel.app/).

Push ke branch `main` mencetuskan deployment production melalui integrasi GitHub Vercel. Workflow **Check application** turut menjalankan semakan sintaks dan `npm test` pada push serta pull request.

Untuk kemas kini aset, naikkan `CACHE_VERSION` dalam `service-worker.js` dan versi URL `style.css`/`script.js` dalam `index.html`. URL berversi memastikan halaman baharu tidak digabungkan dengan skrip lama ketika service worker sedang dikemas kini. Service worker hanya menyimpan aset aplikasi yang disenaraikan; respons API diurus oleh modul data. Semasa pengaktifan, hanya cache lama dengan awalan `waktu-solat-` dipadamkan.

## Pengesahan semasa

Semakan modul pada **23 September 2026**:

- **36 ujian lulus:** 20 data waktu solat, 6 kiblat dan 10 service worker.
- Permintaan langsung untuk WLY01, September 2026, mengembalikan 30 hari dan jadual yang sama daripada kedua-dua sumber API selepas penormalan.
- Jadual Oktober 2026 berjaya dimuatkan dengan 31 hari.
- Endpoint pemetaan GPS bagi koordinat Kuala Lumpur mengembalikan WLY01.

Semakan pelayar turut meliputi:

- Paparan desktop 1440px serta telefon 390px dan 320px tanpa limpahan mendatar halaman.
- Carian lokasi, kegemaran, jadual September/Oktober, BM/EN dan format 12/24 jam.
- Jadual tersimpan selepas muat semula offline; zon tanpa cache memaparkan ralat tanpa waktu daripada zon lain, kemudian pulih apabila sambungan kembali.
- Simulasi 30 September, 21:00 MYT: Subuh esok menggunakan jadual 1 Oktober; jadual September kekal 30 baris selepas menukar bahasa dan format.
- Dialog boleh ditutup dengan Escape, fokus kembali ke butang asal, dan pautan langkau mengekalkan paparan semasa.
- Migrasi cache versi lama `v16` kepada `v17` selepas satu muat semula, tanpa ralat JavaScript.
- Audit axe pada paparan cerah/gelap dan dialog lokasi tidak melaporkan pelanggaran automatik; kawasan hiasan tertentu masih memerlukan penilaian visual.

Semakan ini tidak menggantikan pengesahan semua zon atau ujian GPS dan sensor pada telefon fizikal.
