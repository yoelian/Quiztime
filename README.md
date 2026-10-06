# 🎮 Quiztime - Web Kuis Interaktif Realtime Kelas

Aplikasi kuis interaktif multiplayer realtime ala **Kahoot / Quizizz** yang didesain playful, responsif, dan menyenangkan untuk interaksi antara **Guru (Host)** dan **Siswa (Peserta)**.

---

## 🌟 Fitur Utama

1. **👨‍🏫 Alur Guru (Host)**:
   - **Login Google**: Masuk dengan akun Google resmi atau simulasi profil cepat.
   - **Bank Soal & Durasi Timer**: Buat soal pilihan ganda A, B, C, D, pilih kunci jawaban, dan tentukan durasi timer per soal (10s, 15s, 20s, 30s, 45s, 60s).
   - **Luncurkan Room Kuis**: Mendapatkan **Kode PIN Room 6-digit** dan tombol **Salin Link Room** untuk dibagikan ke siswa (misal lewat WhatsApp atau proyektor kelas).
   - **Lobby Realtime**: Menampilkan daftar siswa yang masuk secara langsung dengan avatar dan nama.
   - **Kontrol Penuh Layar Proyektor**:
     - Tombol **Start Quiz**.
     - **Fase Preview (3–5 Detik)**: Soal tampil *fullscreen* di layar depan agar siswa fokus membaca.
     - **Fase Menjawab (Timer)**: Soal mengecil secara dinamis ke atas, pilihan A/B/C/D muncul, timer berjalan mundur, dan live counter siswa yang menjawab.
     - **Fase Reveal**: Highlight kunci jawaban benar (hijau menyala), jawaban salah memudar, dan statistik pilihan siswa.
     - **Fase Leaderboard**: Papan Top Score sementara dengan streak combo api 🔥.
     - **Fase Podium Akhir**: Panggung Juara 1, 2, 3 dengan ledakan konfeti tiada henti 🎊 dan efek suara selebrasi!

2. **📱 Alur Siswa (Peserta via HP)**:
   - Buka link kuis / web ➔ Login Google ➔ Masukkan PIN Room.
   - Menunggu di Waiting Room bersama teman sekelas.
   - Saat kuis dimulai: Tombol jawaban besar, warna-warni playful (Merah, Biru, Kuning, Hijau) dengan feedback getar/kunci jawaban instan.
   - Poin dihitung otomatis berdasarkan **kebenaran, kecepatan menjawab, dan streak beruntun**.

3. **🔊 Efek Suara Playful (Web Audio API)**:
   - Bebas download file audio eksternal; suara synthesizer 8-bit ceria (pop masuk lobby, countdown tick, fanfare go, correct chime, wrong buzz, dan victory fanfare) langsung dibuat di browser.

---

## 🚀 Cara Menjalankan

Server saat ini sudah aktif dan berjalan di:
👉 **`http://localhost:3000`**

Untuk menjalankan kembali di lain waktu:
```bash
cd d:\Yobel\playful-quiz
npm run dev
```

---

## 🔑 Konfigurasi Google OAuth Resmi (Opsional)

Jika ingin menghubungkan ke Google Sign-In asli Google Cloud:
1. Buka [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Buat **OAuth 2.0 Client ID** (Web Application).
3. Isi:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Masukkan Client ID dan Secret ke file `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=isi_client_id_kamu
   GOOGLE_CLIENT_SECRET=isi_client_secret_kamu
   NEXTAUTH_SECRET=playful-quiz-secret-super-key-2026
   NEXTAUTH_URL=http://localhost:3000
   ```
*(Catatan: Aplikasi sudah dilengkapi tombol **Simulasi Google Cepat** sehingga dapat langsung dicoba dan dimainkan tanpa harus setting Google Cloud terlebih dahulu).*
