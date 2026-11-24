# Backend Statis Map Vector Tile Kota Bandung

Proyek ini merupakan implementasi backend statis **Map Vector Tile (MVT)**
menggunakan arsitektur koordinat XYZ Tile (`/{z}/{x}/{y}.pbf`) untuk wilayah
Kota Bandung. File tile dilayani langsung dari folder proyek sehingga dapat
di-hosting di GitHub Pages tanpa server aplikasi.

Dataset contoh disimpan sebagai GeoJSON. Script Node.js menggunakan
`geojson-vt` dan `vt-pbf` untuk membagi data menjadi tile biner `.pbf` pada
zoom level 10–15. Frontend MapLibre GL JS memuat tile tersebut dan
memvisualisasikannya di atas basemap CartoDB Voyager.

## Konsep Dasar

Data geospasial dapat disajikan dalam bentuk **raster** atau **vektor**.
Raster tersusun dari piksel dan cocok untuk citra atau latar peta. Vektor
menyimpan geometri dan atribut: **Point** untuk lokasi, **LineString** atau
polyline untuk jalur, serta **Polygon** untuk area.

Pada skema XYZ, peta dibagi menjadi kotak-kotak kecil di setiap tingkat zoom:

- **`z`** adalah tingkat perbesaran (*zoom level*).
- **`x`** adalah indeks kolom tile.
- **`y`** adalah indeks baris tile.

Ketika peta digeser atau diperbesar, viewer meminta file
`/{z}/{x}/{y}.pbf` yang sesuai dengan area dan zoom yang terlihat. Dengan
demikian, klien tidak perlu mengunduh satu dataset peta utuh sekaligus.

## Struktur Direktori

```text
Map-Vector-Tile/
├── data/
│   └── sample.geojson              # Data contoh Point, LineString, dan Polygon
├── scripts/
│   └── generate-tiles.js           # Generator GeoJSON ke MVT
├── tiles/
│   └── {z}/{x}/{y}.pbf             # Tile hasil generate untuk zoom 10–15
├── index.html                      # Viewer MapLibre GL JS
├── .nojekyll                       # Menonaktifkan pemrosesan Jekyll di Pages
├── .gitignore                      # Mengabaikan node_modules/
├── package.json                    # Skrip dan dependency Node.js
├── package-lock.json               # Versi dependency yang terkunci
└── README.md                       # Dokumentasi proyek
```

Folder `tiles/` dibuat atau diperbarui saat generator dijalankan. File-file di
dalamnya perlu disertakan dalam repository agar dapat dilayani GitHub Pages.

## Instalasi dan Generate Tile

Pastikan Node.js telah terpasang, lalu jalankan perintah berikut dari root
proyek:

```bash
npm install
node scripts/generate-tiles.js
```

Generator membaca `data/sample.geojson`, membatasi pencarian tile menggunakan
batas data, lalu menyimpan tile yang berisi fitur ke
`tiles/{z}/{x}/{y}.pbf` untuk zoom level 10 hingga 15. Daftar file dan jumlah
tile yang berhasil dibuat ditampilkan di terminal.

## Menjalankan Viewer

### Secara lokal

Buka `index.html` menggunakan ekstensi Live Server di Visual Studio Code.
Viewer dan basemap memerlukan koneksi internet untuk memuat MapLibre GL JS,
style CartoDB Voyager, dan aset peta.

### Melalui GitHub Pages

1. Pastikan folder `tiles/` hasil generate sudah di-commit ke repository.
2. Buka **Settings → Pages** pada repository GitHub.
3. Pilih branch `main` dan folder `/(root)` sebagai sumber deployment.
4. Buka alamat GitHub Pages yang ditampilkan pada pengaturan tersebut.

## Fitur Frontend Viewer

Viewer pada `index.html` menyediakan:

- Basemap terang CartoDB Voyager dengan layer MVT Kota Bandung di atasnya.
- Kartu informasi bergaya *light glassmorphism* untuk zoom saat ini dan
  koordinat tile tengah `z/x/y` yang diperbarui saat peta digeser atau di-zoom.
- Toggle visibilitas terpisah untuk layer **Polygon**, **Polyline**, dan
  **Point**.
- Sakelar batas kotak tile melalui `map.showTileBoundaries`, aktif secara
  default.
- Popup inspeksi yang menampilkan seluruh atribut fitur saat diklik, serta
  kursor pointer ketika diarahkan ke fitur.
- Tombol **Reset Kamera** untuk kembali ke posisi awal Kota Bandung.
