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

Ketiga file di sini diambil 18 Nov 2026 dari dashboard final radar-4 di Chromium headless (viewport 1440×900, tanpa error console):
1. `1-board.png` — board penuh, 198 baris (151.394 byte). Rank 1 Sentora Curator $47,6M (THIN), rank 2 Steakhouse Financial $47,6M (THIN), rank 3 Gauntlet $38,2M; badge vonis FARM/THIN terlihat (Nonce Capital FARM rank 6, Bittensor dTAO FARM rank 8).
2. `2-detail.png` — dialog detail Sentora Curator, rank 1 dari 198, dengan rincian model radar-4 (fitted multiple 0,0173, growth multiplier 1, maturity flat 1, chain multiplier 1, category factor 1, rank range 1-1) + farm economics dengan verdict THIN (capital $150, hold 30 hari, total cost $17) (167.434 byte).
3. `3-filtered.png` — panel "Most likely to launch a token" (USDD board rank 5, Bittensor dTAO 8, Polymarket International 9, OnRe 10, CIAN Yield Layer 12, Defi Saver Asset Management 13, Symbiotic 14, OpenTrade 15, Lightning Network 18, BitFi Basis 19 + catatan "Flagged Lower" untuk Sentora/Steakhouse/Gauntlet), diambil dari dashboard baru di Chromium headless (viewport 1440×900, tanpa error console, 118.749 byte)

Riwayat: ketiga file sebelumnya diambil 16 Nov 2026 (178 baris, radar-2); file ke-3 diganti 17 Nov 2026 di branch improvement-r1-r2. Ketiganya diganti lagi 17 Nov 2026 di branch improvement-round2 (radar-3, 198 baris). Ketiganya diganti lagi 18 Nov 2026 di branch improvement-round5 (radar-4, 198 baris).
