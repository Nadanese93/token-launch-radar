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

Ketiga file di sini diambil 17 Nov 2026 dari dashboard final radar-3 di Chromium headless (viewport 1440×900, tanpa error console):
1. `1-board.png` — board penuh, 198 baris (150.727 byte)
2. `2-detail.png` — dialog detail Sentora Curator, rank 2 dari 198, dengan rincian model (fitted multiple, maturity flat, category factor, rank range 2-3) + farm economics dengan verdict FARM (170.578 byte). Sentora dipilih karena ia baris baru tertinggi dari 20 baris di atas floor lama; rank 1 adalah Steakhouse Financial.
3. `3-filtered.png` — panel "Most likely to launch a token" (USDD, Bittensor dTAO, Figure Markets Prime, BitFi Basis, OnRe, CIAN Yield Layer, Defi Saver Asset Management, OpenTrade, Plume Vaults, Polymarket International + catatan "Flagged Lower" untuk Steakhouse/Sentora/Veda), diambil dari dashboard baru di Chromium headless (viewport 1440×900, tanpa error console, 122.711 byte)

Riwayat: ketiga file sebelumnya diambil 16 Nov 2026 (178 baris, radar-2); file ke-3 diganti 17 Nov 2026 di branch improvement-r1-r2. Ketiganya diganti lagi 17 Nov 2026 di branch improvement-round2 (radar-3, 198 baris).
