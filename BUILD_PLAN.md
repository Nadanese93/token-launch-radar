# Build plan — Token Launch Radar

## 0. Yang sudah terverifikasi (16 Nov 2026, live)

- Bounty: https://make.fun/bounty/token-radar-01 — $1,325, deadline
  14 Des 2026 10:00 UTC (17:00 WIB), escrow $1,325 USDC sejak
  14 Nov 2026 02:08:36 UTC, 10 tempat dibayar (1st $1,000, 2nd–5th $50,
  6th–10th $25). **Tidak ada perubahan** dari data awal.
- Brief: baca sealed snapshot DefiLlama, tentukan protokol tokenless
  (bukan wrapped/staked/bridged dari token yang sudah diperdagangkan),
  ranking berdasarkan implied value peluncuran, serahkan dashboard web
  (board + detail tiap protokol + langkah farming). AI judge membandingkan
  dua dossier sekaligus; ranking berdasarkan win rate.
- Deliverables: repo GitHub publik (atau source bundle), dibuat setelah
  kompetisi dibuka, lisensi OSI, `main.ts` (Node 22) di root,
  `vendor/makefun-board.ts` dari kit, `dashboard/` statis tanpa network,
  `board.json` ≥ 100 baris (seluruh watchlist tercakup, tiap baris implied
  value + farm plan), 3 screenshot di `screenshots/`, `dossier.json` dari
  vendor, dan transkrip agent.
- Gate (dari kit): dashboard ≤ 400 file dan ≤ 4 MiB; board 100–4000 baris;
  farm steps 3–12 string @ 20–600 karakter; implied value ≤ $1e14;
  3–4 screenshot ≤ 512 KiB, sisi panjang ≤ 1440, sisi pendek ≥ 800;
  dossier ≤ 1,5 MiB, teks ≤ 65536 bytes.
- Submit: HTTP/CLI (`node cli/makefun.mjs submit` dari dalam kit), BUKAN
  MCP. Perlu: repo_url + commit_sha + bundle transkrip + entry_message
  (make.fun entry v1, ditandatangani wallet akun, berlaku 10 menit) +
  entry_signature. Max 5 submit/hari, 10 total; hard limit 20 entry per
  akun per kompetisi. Akun harus punya wallet Solana (akun agent sudah
  ada: `D3DHTfSdPaKzz9jUmCv4HshXN9SK4hqkyR3jEhyNTWFu`).
- Repo harus milik entrant: owner = login GitHub akun (Nadanese93), atau
  commit membawa `.makefun/owner.json` berisi wallet akun.
- Kit resmi sudah diunduh: `kit/` (token-radar-01-kit.tar.gz, 5,96 MB) —
  berisi `input/snapshot.json` (758 protokol ≥ $5 jt TVL, 40 watchlist),
  `input/README.md` (field guide), starter template, `vendor/` dan CLI.
  JANGAN jalankan CLI kit sebelum akun Make.fun terdaftar (step 1 skill:
  sign in dengan keypair agent → API key `af_...` 30 hari).

## 1. Transkrip + usage logging (SEJAK AWAL — jangan ditunda)

- Entry yang diterima mulai 17 Nov 2026 00:00 UTC **ditolak tanpa
  transkrip** bila diwajibkan.
- Session file Muse app tidak membawa usage → usage dilampirkan dengan
  `--muse-usage <file>` saat bundle.
- Bundle harus mencakup SEMUA sesi yang mengerjakan entry: sesi top-level
  + setiap subagent/worker/child, utuh. Jangan tulis ulang sesi dari ingatan.
- Redaksi: bundle otomatis menghapus email, path home, username, dan
  kredensial; tambahkan `--redact` untuk data pribadi Rangga (nama lengkap,
  email, telepon, alamat) bila muncul di sesi. Jangan redact kode, file
  entry, command, output, atau reasoning — itu bisa didiskualifikasi.
- Sebelum submit pertama, jalankan `bundle --dry-run` untuk melihat sesi
  apa yang ditemukan.

## 2. Pahami snapshot (baca kit/input/README.md + snapshot.json)

- Field per protokol: pelajari 10 field yang dibawa snapshot + aturan
  tokenless (token null, parentProtocol kosong, kategori terlarang,
  nama terlarang, penanda versi). Snapshot TIDAK membawa ranking, implied
  value, farm plan, atau flag airdrop — itu pekerjaan entry.
- Validasi: 758 protokol, 40 watchlist, floor $5.000.000 TVL.
- Catatan: snapshot beku — data tidak berubah selama kompetisi. Model
  harus membaca angka snapshot, bukan daftar nama yang dihafal.

## 3. Implementasi model (lib/model.ts)

- Lengkapi `isTokenless`, `scoreProtocol`, `impliedValue` sesuai desain
  3 lapis di file itu. Kalibrasi bobot dengan data nyata (cek sebaran
  skor; hindari semua protokol menumpuk di 90+ atau 10-).
- Implied value: bandingkan dengan protokol sejenis yang SUDAH bertoken
  (median FDV/TVL kategori), kali TVL, kali diskon ketidakpastian.
  Tampilkan rentang rendah–tengah–tinggi, bukan angka pasti.
- Farm plan: 3–12 langkah konkret per protokol (20–600 karakter),
  spesifik ke protokol itu (chain, aksi, perkiraan biaya, bukti).

## 4. Implementasi main.ts

- Baca snapshot → saring tokenless → skor → ranking → tulis
  `board.json` (≥ 100 baris, seluruh watchlist) + salin data ke
  `dashboard/board.json` → `buildDossier` → `dossier.json`.
- Uji lokal: `node main.ts`, periksa board.json (jumlah baris, watchlist
  tercakup, farm steps valid, implied value masuk akal).

## 5. Dashboard (dashboard/)

- Lengkapi `app.js`: render tabel dari board.json, filter teks +
  kategori, sort, tampilan detail + farm plan. Tanpa network.
- Uji: buka `dashboard/index.html` di browser, pastikan render tanpa
  internet (matikan network / buka dari file).

## 6. Screenshot (screenshots/)

- 3 gambar: 1) board, 2) detail protokol, 3) tampilan terfilter.
- Syarat gate: ≤ 512 KiB tiap file, sisi panjang ≤ 1440 px, sisi pendek
  ≥ 800 px. Ambil dari browser (bukan hasil generate).

## 7. Repo GitHub + submit (JANGAN dulu)

- Butuh dari Rangga: persetujuan nama repo (usulan: `token-launch-radar`),
  dan instalasi GitHub App Muse pada repo baru itu (repo harus publik,
  owner Nadanese93, LICENSE MIT sudah ada di scaffold).
- Buat repo → commit scaffold + hasil build → `node cli/makefun.mjs init`
  bila perlu anchor/drand (lihat kit) → daftar akun Make.fun dengan
  keypair agent → `wallet add` → `bundle --dry-run` → `check` →
  submit pertama (sisakan kuota: max 5/hari, 10 total).
- Submit HANYA setelah gate lokal lolos dan transkrip lengkap.

## Risiko / ketidakpastian

- AI judge bersifat subjektif (perbandingan berpasangan) — kualitas
  narasi dossier + kegunaan dashboard sama pentingnya dengan angka.
- Snapshot beku: protokol yang meluncurkan token SETELAH snapshot tetap
  dinilai dari data snapshot (aturan mainnya begitu).
- Field snapshot terbatas (10 field): faktor seperti pendanaan / tim /
  volume mungkin tidak tersedia — model harus bekerja dengan yang ada,
  dan kekurangan itu dicatat jujur di dossier.
- Kuota submit terbatas (10 total) — jangan buang submit untuk coba-coba;
  tiap submit harus lolos `check` lokal dulu.
