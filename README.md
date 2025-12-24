# Earthquake Early Warning System - Indonesia 🌍

Aplikasi peringatan dini gempa bumi untuk Indonesia dengan visualisasi peta real-time dan notifikasi berbasis lokasi menggunakan data dari BMKG (Badan Meteorologi, Klimatologi, dan Geofisika).

## ✨ Fitur

- 🗺️ **Peta Interaktif**: Visualisasi gempa bumi real-time di peta Indonesia
- 📍 **Notifikasi Berbasis Lokasi**: Dapatkan peringatan saat gempa terjadi di sekitar Anda
- 🔔 **Browser Notifications**: Notifikasi otomatis melalui browser
- 📊 **Data Real-time**: Update otomatis setiap 5 menit dari API BMKG
- 🎯 **Marker Color-coded**: Warna berdasarkan magnitude (hijau, kuning, oranye, merah)
- 📱 **Responsive Design**: Tampilan optimal di desktop dan mobile
- ⚡ **Pulse Animation**: Animasi untuk gempa yang baru terjadi (<1 jam)

## 🚀 Setup

### Server (Express.js + Supabase)

```bash
cd server
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Client (React TypeScript)

```bash
cd client
npm install
npm run dev
```

Client akan berjalan di `http://localhost:5173`

## 📡 API Endpoints

- `GET /api/earthquakes` - Semua gempa dengan pagination
- `GET /api/earthquakes/latest` - Gempa terbaru
- `GET /api/earthquakes/nearby?lat=&lng=&radius=` - Gempa di sekitar lokasi
- `GET /api/earthquakes/stats` - Statistik gempa
- `GET /api/earthquakes/:id` - Detail gempa spesifik

## 🎯 Cara Penggunaan

1. **Setup Lokasi**: Saat pertama kali membuka aplikasi, Anda akan diminta untuk:

   - Menggunakan lokasi otomatis (geolocation), atau
   - Input koordinat manual
   - Pilih radius notifikasi (50km, 100km, 200km, 500km)

2. **Aktifkan Notifikasi**: Izinkan browser untuk mengirim notifikasi agar mendapat peringatan gempa

3. **Lihat Peta**:

   - Marker gempa ditampilkan dengan warna sesuai magnitude
   - Klik marker untuk melihat detail
   - Gunakan sidebar untuk melihat daftar gempa

4. **Auto-refresh**: Data akan di-refresh otomatis setiap 5 menit

## 🎨 Color Coding

- 🟢 **Hijau**: Magnitude < 5.0
- 🟡 **Kuning**: Magnitude 5.0 - 5.9
- 🟠 **Oranye**: Magnitude 6.0 - 6.9
- 🔴 **Merah**: Magnitude ≥ 7.0

## 📊 Sumber Data

Data gempa bumi berasal dari **BMKG Indonesia**:

- https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json
- https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json
- https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json

## 🛠️ Tech Stack

### Server

- Express.js
- Supabase (PostgreSQL)
- TypeScript
- node-cron (scheduled fetching)
- axios

### Client

- React 19
- TypeScript
- Leaflet / React-Leaflet
- Tailwind CSS
- Vite

## 📝 Environment Variables

Server `.env`:

```env
PORT=3000
FETCH_INTERVAL=5

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Catatan**: Pastikan Anda sudah membuat tabel `earthquakes` di Supabase dengan struktur yang sesuai.

## ⚠️ Browser Permissions

Aplikasi memerlukan 2 permission:

1. **Geolocation** (opsional) - untuk deteksi lokasi otomatis
2. **Notifications** - untuk notifikasi gempa

## 📄 License

MIT

## 🙏 Attribution

Data gempa bumi disediakan oleh **BMKG Indonesia** (Badan Meteorologi, Klimatologi, dan Geofisika)
