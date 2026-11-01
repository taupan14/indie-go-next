# Indie GO — Milestone 1 (fondasi)

Isi: tema terang/gelap (token di `src/app/globals.css`), bilingual ID/EN (`src/i18n`),
klien Supabase, layout dasar, dan skema database + RLS (`supabase/migrations/0001_init.sql`).

## Catatan Next.js 16

Penjaga sesi bernama `src/proxy.ts` (sebelumnya `middleware.ts`, sudah usang). Jika memakai Next.js 15, ganti kembali namanya menjadi `middleware.ts` dan fungsinya menjadi `middleware`.

## Menjalankan

1. `npm install`
2. Salin `.env.example` ke `.env.local`, isi URL dan anon key Supabase.
3. Jalankan isi `supabase/migrations/0001_init.sql` di SQL Editor Supabase (atau `supabase db push`).
4. Buat super admin: daftar sekali, lalu di SQL Editor:
   `update profiles set role = 'super_admin' where username = 'NAMA_ANDA';`
5. `npm run dev`

## Sudah ada (Milestone 1b)

Masuk/Daftar (layar terbagi, email + Google), sesi login (middleware), header dengan pengalih bahasa dan tema,
Beranda (daftar topik, strip pengumuman yang bisa ditutup, banner samping).

## Sudah ada (Milestone 1c)

Detail thread: foto, video YouTube, dan link; komentar terkunci untuk tamu; komentar dan satu level balasan, upvote, dan gabung/keluar komunitas untuk pengguna login.
Isi thread dan komentar ditampilkan sebagai teks biasa (aman dari XSS), dan URL media hanya http(s).

## Sudah ada (Milestone 1d)

Buat thread (form satu halaman): kategori, pilihan komunitas (hanya yang diikuti), foto (maks. 4, 5 MB), link YouTube/URL, tag.
Kurasi: kata kasar, judi, narkoba, pornografi, dan perdagangan manusia ditolak langsung dengan alasan (`src/lib/curation.ts`);
daftar bisa ditambah lewat tabel `filter_terms`. Batas posting 10 thread per jam per pengguna.
Jalankan juga `supabase/migrations/0002_storage_seed.sql` (bucket foto dan kategori awal).
Wajib isi `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` agar daftar tambahan dari admin terbaca.

PENTING: pemindaian gambar (nudity, kekerasan/darah) BELUM aktif. Fungsi `scanImage` di `src/lib/curation.ts` masih kosong
sampai penyedia moderasi gambar dipilih. Konten SARA/rasis juga tidak bisa ditangkap daftar kata secara andal; andalkan laporan pengguna.
Simpan draf belum ada.

## Sudah ada (Milestone 1e)

Daftar komunitas (`/komunitas`, grid kartu dengan banner, filter Semua/Diikuti/Populer/Terbaru) dan detail komunitas
(`/komunitas/[slug]`: banner di atas, daftar thread, sidebar, dialog daftar anggota untuk pengguna login, tombol Gabung/Keluar,
Buat thread dengan komunitas terpilih). Tamu boleh melihat daftar thread komunitas tetapi tidak daftar anggota.
Jalankan juga `supabase/migrations/0003_community_thread_count.sql`.
Komunitas dibuat super admin lewat panel admin (belum ada); sementara, tambahkan lewat SQL Editor.

## Sudah ada (Milestone 1f)

Profil (`/u/[username]`, hanya untuk pengguna login): avatar, level popularitas, tanggal bergabung, meter poin (mis. 214 [bar] 300),
komunitas yang diikuti (dengan tanggal bergabung), tab Thread/Komentar, dan tab Tersimpan yang hanya terlihat pemilik (isinya menyusul di Fase 2).
Poin = 1 per upvote + 2 per komentator unik + 3 per share, tanpa aksi diri sendiri/akun tidak aktif/konten tersembunyi (`0004_popularity.sql`).
Ambang level (Pendatang 0, Aktif 50, Populer 150, Tokoh 300) ada di `src/lib/popularity.ts`.
Jalankan juga `supabase/migrations/0004_popularity.sql`. Nama penulis di detail thread menjadi tautan ke profil untuk pengguna login.

## Sudah ada (Milestone 1g)

Pengaturan (`/settings`, menu kiri + form): Profil (foto, username, bio; foto dan teks melewati kurasi), Akun dan keamanan
(ganti email, ganti kata sandi, status Google, hapus akun), Tampilan dan bahasa (ID/EN, terang/gelap/sistem; tersimpan per perangkat),
Privasi (sembunyikan daftar komunitas di profil), Tersimpan (menyusul Fase 2).
Hapus akun: butuh konfirmasi username (+ kata sandi untuk akun email) dan memakai service role. Thread/komentar tetap ada sebagai "Akun dihapus".
Admin komunitas tidak bisa menghapus akun sebelum perannya dialihkan.
Jalankan juga `supabase/migrations/0005_account.sql`. Di Supabase, atur Auth > Email agar perubahan email memakai konfirmasi.

## Sudah ada (Milestone 2A: Panel admin tahap A)

`/admin` (hanya super admin; tab Ringkasan/Moderasi/Konten/Pengguna/Sistem, teks panel masih Bahasa Indonesia saja).

- Komunitas (`/admin/komunitas`): buat komunitas dengan email admin. Email terdaftar langsung jadi admin; jika belum, undangan dikirim lewat Supabase Auth.
- Laporan (`/admin/laporan`): antrean per konten; sembunyikan, abaikan, suspend penulis, pulihkan. Semua aksi dicatat di audit_logs.
- Tombol Laporkan di thread dan komentar; 3 pelapor berbeda menyembunyikan konten otomatis (bisa dipulihkan admin).
  Jalankan juga `supabase/migrations/0006_admin.sql`. Di Supabase: Auth > URL Configuration, tambahkan `<domain>/auth/callback` ke Redirect URLs agar undangan berfungsi.

## Sudah ada (Milestone 2B: Panel admin tahap B)

Pengguna (cari, suspend, blokir, aktifkan), Kategori (tambah/ubah/hapus, warna, urutan), Banner (strip + samping, jadwal WIB, urutan),
Filter konten (kata/domain tambahan), Popularitas (bobot poin dan ambang level), Audit log (100 terbaru).
Jalankan juga `supabase/migrations/0007_settings.sql`. Banner belum mendukung gambar.

## Sudah ada (Milestone 3: penyesuaian Banner dan Header)

Banner: form "Banner baru" di atas, pratinjau Beranda mini dengan seret-dan-lepas (antar strip/samping, plus tombol ▲▼), daftar ringkas yang membuka dialog detail,
jenis Teks atau Gambar (unggah aset ke bucket `media`). Header: indikator menu aktif yang meluncur. Bar progres tipis bergaya neon (warna primary solid, titik bulat bercahaya di ujung), tampil saat pindah halaman/aksi form.
Jalankan juga `supabase/migrations/0008_banner_kind.sql`.

## Sudah ada (Milestone 3b)

Banner: batas tampil 3 strip dan 5 banner samping; strip menampilkan deskripsi dari "Teks singkat".
Komunitas: halaman `/komunitas/[slug]/kelola` (admin komunitas dan super admin) untuk upload banner dan foto profil (logo) serta mengubah deskripsi, pengumuman, aturan.
Gambar melewati hook `scanImage`; teks melewati filter kurasi. Tautan "Kelola komunitas" ada di sidebar halaman komunitas.

## Sudah ada (Milestone 3c: responsif mobile)

Header: di bawah 768 px berubah menjadi logo + tombol "+" (buat thread) + menu hamburger animasi yang membuka panel (menu, pengaturan, bahasa, tema, masuk/keluar); header menempel di atas saat scroll.
Daftar topik di layar kecil menyembunyikan kolom "Aktif"; pratinjau banner admin menjadi satu kolom; header profil bisa turun baris.

## Sudah ada (Milestone 4: detail thread v2)

Kotak penulis: foto profil, lencana reputasi (level popularitas), jumlah thread, tanggal dan jam (WIB); lencana dan jumlah thread hanya untuk pengguna login.
Placement Ads di bawah kotak penulis memakai banner samping dari panel admin. Bar interaksi: Suka (menggantikan upvote lama), Tidak suka (tidak mengurangi popularitas),
rating emoji 5 tingkat (satu per pengguna, menekan skor yang sama membatalkan, penulis tidak bisa menilai thread sendiri), dan Bagikan
(salin tautan, WhatsApp, Telegram, X, Facebook, menu bagikan bawaan HP; share akun login dicatat untuk poin popularitas).
Ruang Google Ads berlabel di antara thread dan komentar (`src/components/AdSlot.tsx`, belum memuat skrip iklan).
Jalankan juga `supabase/migrations/0009_reactions.sql` lalu `0010_ratings_fix.sql`.

## Sudah ada (Milestone 5: footer)

Footer (opsi B): pita dukungan dengan QRIS + tombol Saweria (tampil bila diisi di Admin > Sistem > Dukungan), tautan Tentang Kami, FAQ, Kebijakan Privasi, Syarat & Ketentuan,
dan dialog Feedback (email + pesan, penghitung karakter, jebakan bot, batas 3 kiriman/jam per IP, filter kata terlarang). Footer disembunyikan di /masuk dan /admin.
Halaman /tentang, /faq, /privasi, /syarat: draf isi dua bahasa di `src/content/pages.ts` (privasi dan syarat bertanda draf, perlu ditinjau pihak hukum).
Admin: Dukungan (QRIS) dan Feedback (tandai dibaca, hapus). Opsional: isi `FEEDBACK_SALT` di `.env.local` untuk hash IP.
Jalankan juga `supabase/migrations/0011_footer.sql`.

## Belum dikerjakan

Pemindai gambar (nudity, kekerasan), simpan draf, bahasa/tema tersimpan di akun, notifikasi/bookmark/trending (Fase 2),
tombol Bagikan (poin share belum bisa terkumpul), terjemahan Bahasa Inggris untuk panel admin, tes otomatis.
Status: belum dijalankan atau diuji (sandbox tanpa akses internet).
