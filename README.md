# Waktu Solat Malaysia

Aplikasi web untuk menyemak waktu solat mengikut zon di Malaysia, dengan pengesanan lokasi, kiraan masa dan kompas kiblat.

**[Buka aplikasi](https://waktu-solat-two.vercel.app/)** · [Repository GitHub](https://github.com/aafham/Waktu-Solat)

## Ciri semasa

- Paparan Subuh, Syuruk, Zohor, Asar, Maghrib dan Isyak.
- Pilihan negeri dan zon secara manual, atau pengesanan zon melalui GPS.
- Kiraan masa ke waktu seterusnya dan penanda waktu semasa.
- Tarikh Masihi, paparan tarikh Hijrah dan jam analog.
- Arah kiblat berdasarkan koordinat, dengan sokongan sensor orientasi peranti.
- Mod cerah/gelap dan pilihan bahasa BM/EN; sebahagian teks belum diterjemahkan sepenuhnya.
- Simpanan lokasi dan tetapan dalam pelayar.
- Manifest PWA, service worker dan cache aset/data untuk kegunaan terhad ketika offline.

> Paparan Hijrah dikira dalam pelayar dengan pelarasan hari dalam kod; ia bukan tarikh Hijrah yang diambil terus daripada API JAKIM. Sokongan GPS, kompas dan pemasangan PWA bergantung pada pelayar, peranti dan kebenaran pengguna.

## Cara guna

1. Buka [aplikasi](https://waktu-solat-two.vercel.app/).
2. Tekan **Detect Lokasi Saya** dan benarkan lokasi, atau pilih **Pilih Lokasi Secara Manual**.
3. Untuk pilihan manual, pilih negeri dan zon, kemudian tekan **Papar Waktu Solat**.
4. Semak jadual dan kiraan masa.
5. Untuk kiblat, tekan **Aktifkan Kompas** pada peranti yang menyokongnya dan ikut panduan pada skrin.
6. Buka **Tetapan** untuk menukar bahasa, tema atau menetapkan semula cache aplikasi.

Untuk memasang sebagai aplikasi, gunakan pilihan pemasangan atau **Add to Home Screen** dalam pelayar yang menyokong PWA.

## Teknologi dan struktur

Projek statik menggunakan HTML, CSS dan JavaScript biasa, tanpa framework atau proses build.

| Fail | Kegunaan |
| --- | --- |
| index.html | Struktur halaman dan kawalan pengguna |
| style.css | Susun atur responsif dan tema |
| script.js | API, lokasi, jadual, countdown, kompas dan tetapan |
| service-worker.js | Cache aset aplikasi dan respons API |
| manifest.json | Konfigurasi PWA |
| icons/ | Ikon aplikasi dan Apple touch icon |

## Jalankan secara lokal

Prasyarat: Git dan Python 3 untuk pelayan fail statik.

~~~sh
git clone https://github.com/aafham/Waktu-Solat.git
cd Waktu-Solat
python -m http.server 8000
~~~

Buka **http://localhost:8000**. Pada Windows, gunakan **py -m http.server 8000** jika arahan python tidak tersedia.

Gunakan pelayan HTTP lokal; membuka index.html terus melalui file:// tidak mencukupi untuk menguji service worker. GPS dan sensor memerlukan konteks selamat seperti HTTPS atau localhost serta sokongan peranti. Sambungan internet diperlukan untuk mendapatkan data yang belum dicache.

Tiada pemasangan dependency, API key atau environment variable diperlukan oleh kod semasa.

## Sumber data

- **[JAKIM e-Solat](https://www.e-solat.gov.my/)** — jadual waktu solat bulanan mengikut zon.
- **[Malaysia Waktu Solat API](https://api.waktusolat.app/)** — pemetaan koordinat GPS kepada zon.
- Senarai negeri dan zon untuk pilihan manual disimpan dalam ZONE_DATA di script.js.

Endpoint yang digunakan:

~~~text
https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone={ZONE}&period=month
https://api.waktusolat.app/v2/solat/gps/{LAT}/{LON}
~~~

Permintaan dibuat terus dari pelayar. Koordinat dihantar ke API pemetaan zon apabila pengguna menggunakan pengesanan GPS.

## Deployment Vercel

- **Production:** https://waktu-solat-two.vercel.app/
- **Dashboard pemilik:** https://vercel.com/aafhams-projects/waktu-solat
- **Repository:** aafham/Waktu-Solat
- **Production branch:** main
- **Application preset:** Other
- **Root directory:** ./
- **Build:** Tiada; fail statik di root dihidangkan terus.

Projek telah diimport melalui integrasi GitHub Vercel. Push ke main mencetuskan deployment production.

Apabila mengubah aset aplikasi, kemas kini CACHE_VERSION dalam service-worker.js supaya cache lama diganti. Jika paparan lama masih muncul, gunakan **Tetapan → Reset Cache Aplikasi**; tindakan ini juga memadam tetapan dan lokasi tersimpan.

## Semakan deployment

Pada 20 September 2026:

- Deployment production berstatus **Ready**.
- Pemilihan manual **WLY01 — Kuala Lumpur, Putrajaya** berjaya memuatkan waktu solat dan countdown.
- Semakan sintaks **node --check script.js** lulus.
- GPS dan sensor kompas belum diuji pada telefon.

Ini semakan asas, bukan pengesahan menyeluruh semua zon, peranti atau keadaan offline.

## Isu diketahui dan roadmap

Senarai ini ialah cadangan kerja; ciri dan pembaikan di bawah belum dilaksanakan.

### Ketepatan dan kebolehpercayaan

- [ ] Sahkan tarikh dan zon sebelum menggunakan waktu daripada cache.
- [ ] Gunakan zon masa Asia/Kuala_Lumpur secara konsisten; kunci tarikh semasa masih menggunakan UTC.
- [ ] Asingkan Syuruk daripada pengiraan “solat seterusnya”.
- [ ] Kendalikan pertukaran hari dan bulan, termasuk Subuh selepas Isyak pada hari terakhir bulan.
- [ ] Pastikan hanya satu kad waktu semasa ditandakan aktif.
- [ ] Paparkan status kompas aktif hanya selepas bacaan sensor diterima; jangan mendakwa kalibrasi tanpa pengesahan.
- [ ] Semak ketepatan tarikh Hijrah dan pelarasan hari.

### UI dan UX

- [ ] Letakkan waktu solat seterusnya dan countdown di bahagian teratas.
- [ ] Ringkaskan kad lokasi dan tutup panel manual selepas pilihan berjaya.
- [ ] Seragamkan format waktu tanpa saat pada jadual.
- [ ] Betulkan aksara rosak seperti Â· dan â€” .
- [ ] Tukar “Detect Lokasi Saya” kepada “Kesan Lokasi Saya” dan lengkapkan terjemahan BM/EN.
- [ ] Tambah status memuatkan, offline, ralat dan butang cuba semula.
- [ ] Perkemas akses papan kekunci dan pengurusan fokus dialog tetapan.

### Fungsi tambahan

- [ ] Lengkapkan notifikasi waktu solat: kod asas ada, tetapi butang pengaktifan belum dipaparkan. Kod semasa bergantung pada halaman yang berjalan dan belum menyediakan push latar belakang.
- [ ] Tambah paparan jadual bulanan dan lokasi kegemaran.
- [ ] Tambah panduan pemasangan PWA dalam aplikasi.
- [ ] Tambah ujian untuk cache, pertukaran tarikh, countdown dan tingkah laku offline.
