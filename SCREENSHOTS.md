# screenshots/

Tiga tangkapan layar wajib (diambil dari browser, dari dashboard/ yang
sudah jadi — BUKAN hasil generate):

1. `1-board.png` — tampilan board (tabel ranking)
2. `2-detail.png` — tampilan detail satu protokol + farm plan-nya
3. `3-filtered.png` — tampilan pandangan kedua dashboard ("Most likely to
   launch a token": top 10 berdasarkan implied value di antara kategori
   non-vault; sebelumnya tampilan filter Risk Curators — diganti 17 Nov
   2026 karena filter itu justru menyorot kelemahan board)

Syarat gate: tiap file ≤ 512 KiB, sisi panjang ≤ 1440 px, sisi pendek ≥ 800 px.

Ketiga file di sini diambil 16 Nov 2026 dari dashboard final di Chromium headless (viewport 1440×900, tanpa error console):
1. `1-board.png` — board penuh, 178 baris (142.136 byte)
2. `2-detail.png` — dialog detail Steakhouse Financial, rank 1 dari 178, dengan rincian model + farm plan (199.643 byte)
3. `3-filtered.png` — DIGANTI 17 Nov 2026 (branch improvement-r1-r2): panel "Most likely to launch a token" (USDD, OnRe, Bittensor dTAO, Symbiotic, OpenTrade, Plume Vaults, Hive Protocol, Lightning Network, R25, b14g + catatan "Flagged Lower" untuk Steakhouse/Veda/Gauntlet), diambil dari dashboard baru di Chromium headless (viewport 1440×900, tanpa error console, 111.361 byte)
