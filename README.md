# Token Launch Radar — Make.fun entry (scaffold)

Entry untuk bounty **"Build the best token launch radar"** — https://make.fun/bounty/token-radar-01
Hadiah $1,325 USDC (top 10 dibayar), deadline **Senin 14 Des 2026 17:00 WIB (10:00 UTC)**.

## Ringkasnya

Program `main.ts` (Node 22, standard library only) membaca snapshot beku
DefiLlama di `kit/input/snapshot.json` (758 protokol ≥ $5.000.000 TVL,
40 di watchlist), menentukan protokol mana yang masih **tokenless** (tidak
punya token, bukan produk wrapped/staked/bridged dari token yang sudah
diperdagangkan), lalu merankingnya berdasarkan **implied value** peluncuran
tokennya, dan menulis:

- `board.json` — minimal 100 baris, seluruh watchlist tercakup, tiap baris
  membawa implied value + rencana farming (3–12 langkah)
- `dashboard/` — halaman statis, tanpa network, menampilkan board, detail
  tiap protokol, dan filter
- `dossier.json` — dibuat dengan `buildDossier` dari
  `vendor/makefun-board.ts` (file dari kit, byte-for-byte)
- `screenshots/` — 3 tangkapan: board, detail protokol, tampilan terfilter

Penilaian: AI judge membandingkan dua dossier sekaligus; entry diranking
berdasarkan win rate. Jadi yang menang bukan sekadar tabel TVL, tapi radar
yang menjawab: **protokol pra-token mana yang layak di-farming, dan apa
yang harus dilakukan**.

## Akun

- Repo GitHub: `Nadanese93` (entry ini jadi repo publik pertamanya)
- Akun entry / payout agent (Solana): `D3DHTfSdPaKzz9jUmCv4HshXN9SK4hqkyR3jEhyNTWFu`
  (keypair agent, privat, tidak pernah dibagikan)
- Payout pribadi Rangga (Bitget Wallet): `HeFcYUv7mcm2gyxkbTtGs99eq51Qi4kisifktMR5UUHU`
  (alamat publik saja; payout dari agent dialihkan ke sini atas instruksi)

## Status: entry jadi, teruji lokal, belum submit (16 Nov 2026)

Build selesai dan lolos semua gate lokal (`MAKEFUN_OUTPUT_DIR=out node main.ts --input kit/input/snapshot.json`, exit 0):
- `board.json` — **178 baris** (40/40 watchlist + 138 early ketat), rank 1–178, implied value menurun monoton, farm plan 6 langkah per baris (124–175 karakter)
- `dossier.json` — valid (`makefun/dossier/v1`), 683.929 byte, teks 31.282 byte (cap 65.536), dan **byte-identik** dengan rebuild `buildDossier()`
- `screenshots/` — 3 PNG asli dari dashboard di browser (1440×900, masing-masing < 512 KiB), tanpa error console
- Top 3: Steakhouse Financial ($437,6 jt), Veda ($286,4 jt), Gauntlet ($260,6 jt) — implied value, bukan janji harga

Model `radar-2`: implied = TVL × 0,25 × growth × maturity × chain × prior kategori (Risk Curators 0,7; Onchain Capital Allocator 0,8; lainnya 1,0). Keterbatasan jujur: snapshot tidak punya field `parentProtocol`, jadi cek itu tidak bisa dilakukan; snapshot tidak berisi pendanaan/tim/rencana token; farm plan adalah template dari kategori/chain/TVL/umur, bukan tulisan tangan per protokol; board didominasi Risk Curators (33/178 baris) yang mungkin tidak pernah TGE.

Belum dilakukan: push ke GitHub dan submit ke Make.fun — keduanya menunggu langkah submit (repo `token-launch-radar`, owner Nadanese93).

## Aturan transkrip (penting)

Entry yang diterima mulai **17 Nov 2026 00:00 UTC ditolak tanpa transkrip**
bila transkrip diwajibkan. Pencatatan sesi + usage HARUS aktif sejak
langkah build pertama — bukan ditambahkan di akhir. Session file Muse app
tidak membawa usage; usage dilampirkan dengan `--muse-usage <file>`.

## Cara jalan (setelah build selesai)

```sh
node main.ts            # membaca kit/input/snapshot.json -> board.json, dossier.json, dashboard/
# lalu buka dashboard/index.html di browser dan ambil 3 screenshot ke screenshots/
```

## Lisensi

MIT — lihat `LICENSE`.
