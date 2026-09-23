# Waktu Solat Malaysia

Aplikasi web untuk menyemak waktu solat di seluruh Malaysia, melihat lokasi semasa dan mencari arah kiblat. Reka bentuk ringkas dengan navigasi sisi pada desktop dan **navigasi bawah pada telefon**.

**[Buka aplikasi](https://waktu-solat-two.vercel.app/)** · [Repository GitHub](https://github.com/aafham/Waktu-Solat)

## Ciri utama

- Waktu Subuh, Syuruk, Zohor, Asar, Maghrib dan Isyak **terus daripada JAKIM**, meliputi 60 zon Malaysia.
- Kiraan masa ke solat fardu seterusnya, jadual bulanan dan tarikh Hijrah daripada jadual apabila tersedia.
- Lokasi automatik dengan nama kawasan semasa, koordinat peranti, anggaran ketepatan GPS dan pautan titik lokasi pada peta.
- Nama lokasi sebenar dipaparkan **berasingan daripada zon waktu JAKIM**. Satu zon solat boleh merangkumi beberapa daerah.
- Carian negeri, daerah atau kod zon secara manual, serta lokasi kegemaran.
- Kompas kiblat masa nyata, panduan pusing kiri/kanan dan jarak anggaran ke Kaabah.
- Bahasa Melayu/English, format 12/24 jam dan tema cerah/gelap.
- Pemasangan PWA, jadual tersimpan untuk offline dan pemulihan apabila sambungan kembali.

Semua tarikh dan pengiraan waktu menggunakan `Asia/Kuala_Lumpur`, walaupun peranti menggunakan zon masa lain. Syuruk menandakan tamat Subuh dan tidak dikira sebagai solat fardu seterusnya. Selepas Isyak, kiraan masa menggunakan Subuh sebenar pada hari berikutnya, termasuk ketika bertukar bulan atau tahun. Jika jadual esok belum tersedia, aplikasi memaparkan keadaan tersebut tanpa meneka waktunya.

## Lokasi semasa dan zon solat

1. Pada kunjungan pertama, benarkan permintaan lokasi pelayar. Aplikasi meminta lokasi peranti dengan pilihan ketepatan tinggi.
2. Selepas lokasi diperoleh, nama kawasan, koordinat dan anggaran ketepatan dipaparkan. **Lihat lokasi pada peta** membuka titik koordinat pada OpenStreetMap.
3. Zon waktu JAKIM dipilih daripada pemetaan koordinat, dengan semakan nama kawasan/negeri apabila tersedia.
4. Gunakan **Lokasi saya** untuk mengesan semula. Mod automatik menyemak lokasi semasa aplikasi aktif, paling kerap sekali setiap lima minit; semakan juga dicuba apabila aplikasi kembali aktif.
5. **Tukar lokasi** membolehkan pilihan manual. Pilihan ini menghentikan mod automatik supaya permintaan GPS yang lambat tidak menimpa zon pilihan anda. Aktifkan semula melalui **Lokasi saya** atau tetapan.

Sebelum pengesanan berjaya, zon lalai **WLY01 — Kuala Lumpur, Putrajaya** dilabelkan sebagai belum disahkan. Zon manual/tersimpan juga dikenal pasti dengan jelas. Pengguna sedia ada yang telah menyimpan zon manual mengekalkan pilihan tersebut.

Ketepatan lokasi bergantung pada peranti, isyarat dan izin pelayar. Angka **GPS ±… m** ialah anggaran ketepatan yang diberikan peranti, bukan jaminan lokasi tepat pada meter tertentu. Bacaan dengan ketidakpastian melebihi 5 km tidak digunakan untuk memilih zon secara automatik. Jika nama kawasan tidak dapat dimuatkan, koordinat sebenar masih dipaparkan. Kawasan yang mempunyai zon khas atau pemetaan bercanggah memerlukan pengesahan manual.

## Kiblat masa nyata

Buka **Kiblat → Aktifkan kompas langsung**, kemudian benarkan akses lokasi dan sensor. Pegang telefon mendatar dan jauhkan daripada objek logam.

- Bearing ke Kaabah dikira daripada koordinat semasa, mengikut arah jam dari **utara benar**.
- Bacaan orientasi mutlak yang sah menggerakkan anak panah ketika telefon diputar. Bacaan relatif sahaja tidak mengaktifkan kompas langsung.
- Panduan kiri/kanan menunjukkan anggaran penjajaran; jarak ke Kaabah dikira pada peranti.
- Bacaan WebKit yang menggunakan utara magnet dilabelkan dengan jelas. Penjajaran sensor ialah anggaran, sementara bearing angka berasaskan utara benar.
- Perubahan lokasi dikemas kini sepanjang sesi kompas. Bacaan terlalu condong atau tidak boleh dipercayai tidak digunakan sebagai panduan langsung.
- **Hentikan kompas**, keluar daripada paparan kiblat atau menyembunyikan aplikasi menghentikan sensor dan pemantauan lokasi.

Jika sensor tiada, izin ditolak atau tiada bacaan mutlak diterima, aplikasi menunjukkan **arah tetap** dengan arahan menggunakan rujukan utara. Desktop tanpa sensor masih boleh melihat bearing dan jarak apabila lokasi tersedia.

GPS dan kompas memerlukan HTTPS atau `localhost`, sokongan peranti/pelayar serta izin pengguna. **Ujian telefon fizikal dan ketepatan sensor di lapangan belum dilakukan.** Ujian automatik menggunakan bacaan terkawal untuk menyemak pengiraan dan tindak balas aplikasi; ia tidak menggantikan kalibrasi atau pengesahan kompas sebenar.

## Offline dan pemasangan

Service worker menyimpan fail aplikasi. Jadual disimpan mengikut **zon + tahun-bulan**, selepas semua tarikh dan waktu disahkan. Cache versi 3 hanya menerima jadual yang mempunyai sumber **JAKIM**; cache format lama tidak digunakan.

Data sah digunakan semula selama 24 jam untuk mengurangkan permintaan. **Muat semula data** dalam tetapan meminta salinan baharu tanpa memadam kegemaran atau pilihan pengguna. Jika JAKIM/rangkaian tidak dapat dicapai selepas cubaan semula, aplikasi hanya menggunakan jadual lengkap yang sah untuk zon dan bulan yang diminta. Zon atau bulan lain tidak dijadikan pengganti.

Jadual yang belum disimpan, pemetaan zon baharu dan nama kawasan memerlukan internet. Pengiraan bearing kiblat dibuat setempat, tetapi perolehan lokasi masih bergantung pada peranti.

Gunakan butang **Pasang aplikasi** atau panduan menu pelayar dalam aplikasi. Pilihan pemasangan berbeza mengikut pelayar. Aplikasi belum menyediakan push azan atau peringatan apabila halaman ditutup.

## Jalankan secara lokal

Projek menggunakan HTML, CSS dan JavaScript ES modules, tanpa framework, proses build, API key atau dependency runtime.

Prasyarat: Git, Python 3 untuk pelayan statik, dan Node.js 20+ untuk ujian.

```sh
git clone https://github.com/aafham/Waktu-Solat.git
cd Waktu-Solat
python -m http.server 8000
```

Buka [localhost:8000](http://localhost:8000). Pada Windows, gunakan `py -m http.server 8000` jika perlu. Jangan buka `index.html` melalui `file://`; modul dan service worker memerlukan HTTP.

### Ujian

```sh
npm ci
npm test
npx playwright install chromium
npm run test:e2e
```

`npm test` menggunakan `node:test`. Playwright ialah dependency pembangunan untuk ujian pelayar; konfigurasi ujian memulakan dan menutup pelayan sendiri pada `127.0.0.1:4173`.

Ujian pelayar meniru respons API dan bacaan sensor. **Koordinat simulasi tidak dihantar kepada perkhidmatan luar.** Semua permintaan luar ditiru atau disekat, menjadikan ujian konsisten tanpa bergantung pada API langsung.

## Struktur fail

| Fail                                 | Kegunaan                                                         |
| ------------------------------------ | ---------------------------------------------------------------- |
| `index.html`, `style.css`            | Halaman responsif, navigasi, dialog dan tema                     |
| `script.js`                          | Paparan, jadual, tetapan, kegemaran dan aliran lokasi            |
| `location-service.js`                | GPS, nama kawasan, pembatalan dan semakan lokasi automatik       |
| `prayer-data.js`                     | JAKIM, pengesahan/cache jadual, tarikh Malaysia dan pemetaan zon |
| `zones.js`                           | Katalog 60 zon dalam 14 kumpulan negeri/wilayah                  |
| `qibla.js`                           | Bearing, jarak, sensor kompas dan kitar hayat sesi               |
| `service-worker.js`                  | Cache fail aplikasi dan pemulihan halaman offline                |
| `manifest.json`, `icons/`            | Metadata dan ikon PWA                                            |
| `tests/*.test.js`                    | Ujian unit/integrasi modul                                       |
| `tests/e2e/`, `playwright.config.js` | Ujian aliran pelayar dan susun atur responsif                    |
| `.github/workflows/checks.yml`       | Semakan sintaks, unit dan pelayar pada GitHub Actions            |

## Sumber data dan privasi

| Tujuan                                      | Sumber                                                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Semua waktu solat                           | [JAKIM e-Solat](https://www.e-solat.gov.my/)                                                                         |
| Koordinat dan anggaran ketepatan            | Geolocation API peranti/pelayar                                                                                      |
| Nama kawasan semasa                         | [BigDataCloud Client Reverse Geocoding](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free) |
| Pemetaan koordinat kepada zon               | [Waktu Solat API](https://api.waktusolat.app/docs)                                                                   |
| Paparan titik lokasi selepas pautan ditekan | [OpenStreetMap](https://www.openstreetmap.org/)                                                                      |

```text
https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone={ZONE}&period=month&year={YEAR}&month={MONTH}
https://api.waktusolat.app/zones/{LAT}/{LON}
https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={LAT}&longitude={LON}&localityLanguage={LANG}
```

**Waktu Solat API digunakan untuk pemetaan lokasi sahaja; jadual waktu diminta terus daripada JAKIM.** Jika JAKIM gagal, aplikasi mencuba semula JAKIM sebelum menggunakan cache JAKIM yang sah. Tiada pengiraan waktu solat setempat atau sumber waktu alternatif digunakan.

Pengesanan lokasi menghantar koordinat semasa yang dibenarkan pengguna kepada perkhidmatan nama kawasan dan pemetaan zon. Endpoint BigDataCloud hanya dipanggil dari pelayar menggunakan bacaan lokasi peranti yang baru diperoleh; lihat [dasar penggunaan perkhidmatan percuma](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free), termasuk penggunaan agregat IP/GPS oleh penyedia.

Aplikasi tidak menyimpan koordinat tepat atau nama kawasan GPS dalam localStorage. Hanya kod zon terakhir, mod lokasi, kegemaran, bahasa, format waktu, tema dan jadual disimpan dalam pelayar. Pengiraan kiblat dibuat pada peranti. Tiada akaun atau penyegerakan antara peranti.

Katalog zon disemak pada **23 September 2026**. Pemetaan daerah Kinta dibetulkan kepada **PRK02** mengikut [jadual pihak berkuasa Perak](https://mufti.perak.gov.my/component/content/article/waktu-solat-2026?catid=2). Padanan nama kawasan yang unik dalam negeri yang disahkan boleh membantu apabila endpoint GPS gagal; kawasan khas/bercanggah memerlukan pilihan manual.

## Deployment

Hos sebagai laman statik di Vercel: preset **Other**, root `./`, tanpa arahan build. Push ke `main` mencetuskan production melalui integrasi GitHub Vercel. Workflow **Check application** menjalankan semakan sintaks, ujian modul dan ujian Chromium pada push/pull request.

Apabila aset berubah, naikkan `CACHE_VERSION` dalam `service-worker.js` dan versi URL CSS/JavaScript dalam `index.html`. Versi shell semasa ialah **v18**, termasuk modul lokasi baharu. Hanya cache lama berawalan `waktu-solat-` dipadamkan semasa pengaktifan; respons API diurus oleh modul data.

## Pengesahan versi 2.1

Semakan pada **23 September 2026**:

- **71 ujian modul**: 29 data waktu/pemetaan zon, 14 lokasi, 18 kiblat dan 10 service worker.
- **22 ujian pelayar**: lokasi automatik/nama kawasan, pembatalan GPS dan pemulihan halaman, pilihan manual mengatasi permintaan lambat, kegemaran, BM/EN, 12/24 jam, tema, dialog/fokus, navigasi bawah, jadual bulanan, pemasangan, ralat/cuba semula, offline/pemulihan serta kompas langsung/arah tetap.
- Paparan desktop **1440px** dan telefon **390px/320px** diperiksa untuk limpahan mendatar.
- Simulasi peranti dalam zon masa New York mengesahkan penggunaan tarikh Malaysia dan pertukaran Subuh pada hujung bulan.
- Permintaan langsung JAKIM untuk **kesemua 60 zon, September 2026** berjaya: 1,800 rekod hari-zon dan 10,800 waktu.
- Audit endpoint GPS merangkumi 23 titik Malaysia dan 8 titik luar Malaysia. Audit menemui pemetaan Kinta lama serta kegagalan pesisir Tawau/Semporna; pembetulan daerah dan padanan nama kawasan diuji secara terkawal.

Semakan 60 zon mengesahkan muatan jadual JAKIM untuk bulan tersebut, bukan ketepatan GPS pada setiap titik Malaysia. Lokasi berhampiran sempadan, zon khas, pulau atau kawasan dengan isyarat lemah masih perlu disemak berdasarkan zon yang dipaparkan.

## Cadangan seterusnya

- Peringatan sebelum masuk waktu, dengan pilihan sela masa dan sokongan push yang diuji pada peranti sebenar.
- Peta masjid/surau berdekatan dengan maklumat sumber dan pautan navigasi.
- Eksport jadual bulanan kepada PDF atau kalendar untuk perjalanan dan perkongsian keluarga.

Cadangan ini belum termasuk dalam versi 2.1.
