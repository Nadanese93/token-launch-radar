// Token Launch Radar — Make.fun entry (main.ts)
//
// Reads a frozen DefiLlama snapshot, scores the pre-token protocols in it
// with the radar model in lib/model.ts, and writes the entry bundle:
// board.json, data.js, a static dashboard copy, the screenshots, and a
// dossier.json built with the vendored make.fun library.
//
// Run it like this:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts --input kit/input/snapshot.json
//
// The snapshot flag accepts a file or a directory (a directory means the
// snapshot.json inside it). With no flag, the grader's mount point /input
// is used. The output directory comes from MAKEFUN_OUTPUT_DIR, or "/output"
// when that variable is unset. Nothing here touches a chain: no wallet,
// no signing, no broadcast.

import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRadar, boardIssue, dataScript, parseSnapshot } from './lib/model.ts';
import { validationMarkdown } from './lib/validate.ts';
import { buildDossier } from './vendor/makefun-board.ts';

// Where the grader mounts the sealed snapshot when no --input is given.
const DEFAULT_INPUT = '/input';
// Output directory when MAKEFUN_OUTPUT_DIR is not set.
const DEFAULT_OUTPUT = '/output';
// Caps the bounty sets for the dossier (see vendor/makefun-board.ts).
const DOSSIER_TEXT_CAP = 65536;
const SHOT_MAX = 4;
const SHOT_MAX_BYTES = 524288;
const DASH_MAX_FILES = 400;
const DASH_MAX_BYTES = 4194304;
// A screenshot name the dossier accepts: letters, digits, dot,
// underscore and hyphen only, between 1 and 128 characters.
const SHOT_NAME = /^[A-Za-z0-9._-]{1,128}$/;

/** Print a message to stderr and stop with a failure exit code. */
function die(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

/** The value of --input, in `--input value` or `--input=value` form. */
function inputFlag(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--input') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) die('--input needs a path after it');
      return next;
    }
    if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length);
      if (value === '') die('--input needs a path after the =');
      return value;
    }
  }
  return undefined;
}

/**
 * Turn the --input value (or the default) into the snapshot file itself:
 * a directory contributes its snapshot.json, a file is used as given.
 */
function snapshotFile(given: string | undefined): string {
  const target = given ?? DEFAULT_INPUT;
  let info;
  try {
    info = statSync(target);
  } catch {
    die(`cannot read input ${target}: no such file or directory`);
  }
  if (info.isDirectory()) return join(target, 'snapshot.json');
  if (info.isFile()) return target;
  return die(`input ${target} is neither a file nor a directory`);
}

/** Copy a whole directory tree, creating the destination as needed. */
function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dst);
    } else if (entry.isFile()) {
      copyFileSync(src, dst);
    } else {
      die(`${src} is neither a file nor a directory; refusing to copy it`);
    }
  }
}

/** The screenshot names in a directory, rejecting any name outside the allowed set. */
function shotNames(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch {
    return die(`cannot read screenshots directory ${dir}`);
  }
  for (const name of names) {
    if (!SHOT_NAME.test(name)) {
      die(`screenshot name ${JSON.stringify(name)} is not allowed: use 1-128 letters, digits, . _ -`);
    }
  }
  return names.sort();
}

function main(): void {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const input = snapshotFile(inputFlag(process.argv.slice(2)));

  let raw: string;
  try {
    raw = readFileSync(input, 'utf8');
  } catch {
    die(`cannot read snapshot ${input}`);
  }

  let snap;
  try {
    snap = parseSnapshot(raw);
  } catch (err) {
    die(`invalid snapshot ${input}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const { board, radar, fit, rates } = buildRadar(snap);
  const problem = boardIssue(board, snap);
  if (problem !== null && problem !== undefined) {
    die(`board failed its checks: ${problem}`);
  }

  // Reject a bad screenshot name before writing anything, so a failed
  // run never leaves a half-written output directory behind.
  const shots = shotNames(join(here, 'screenshots'));

  const outEnv = process.env.MAKEFUN_OUTPUT_DIR;
  const outDir = resolve(here, outEnv === undefined || outEnv === '' ? DEFAULT_OUTPUT : outEnv);
  const dashOut = join(outDir, 'dashboard');
  const shotsOut = join(outDir, 'screenshots');
  mkdirSync(dashOut, { recursive: true });
  mkdirSync(shotsOut, { recursive: true });

  // The board: one object, one key, compact JSON plus a final newline.
  const boardPath = join(outDir, 'board.json');
  writeFileSync(boardPath, `${JSON.stringify({ rows: board })}\n`, 'utf8');

  // The dashboard's data script, built from the radar summary.
  const dataPath = join(outDir, 'data.js');
  writeFileSync(dataPath, dataScript(radar), 'utf8');

  // The static dashboard and the screenshots, copied as they are.
  copyTree(join(here, 'dashboard'), dashOut);
  copyTree(join(here, 'screenshots'), shotsOut);

  // The validation page, generated at build from the fit, the rates and the board, so the
  // dossier carries the numbers behind the model (it is written after the copy so it lands
  // in the output dashboard before buildDossier reads it).
  writeFileSync(join(dashOut, 'validation.md'), validationMarkdown(fit, rates, board, snap), 'utf8');

  // The dossier is built from what now sits in the output directory, so
  // the scorer can rebuild the identical bytes from the same files.
  let dossier: Uint8Array;
  try {
    dossier = buildDossier(outDir, {
      text_max_bytes: DOSSIER_TEXT_CAP,
      screenshots: { max: SHOT_MAX, max_bytes: SHOT_MAX_BYTES },
      dashboard: { max_files: DASH_MAX_FILES, max_bytes: DASH_MAX_BYTES },
    });
  } catch (err) {
    die(`buildDossier failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);

  const early = radar.early_size as number;
  const live = radar.live_size as number;
  console.log(
    `radar ${radar.model_version as string}: ${snap.protocols.length} protocols, ` +
      `${snap.watchlist.length} watchlist, ${board.length} rows scored ` +
      `(${early} early, ${live} live) -> ` +
      `${basename(boardPath)}, ${basename(dataPath)}, ${basename(dossierPath)} in ${outDir} ` +
      `(+ dashboard/ and ${shots.length} screenshots)`,
  );
  console.log(
    `fit: log(mcap) = ${fit.intercept.toFixed(3)} + ${fit.slope.toFixed(3)}*log(TVL), R2=${fit.r2.toFixed(3)}, n=${fit.n}, ` +
      `CV ${fit.cv_fit.toFixed(3)} vs flat ${fit.cv_flat.toFixed(3)}, LOO ${fit.loo_fit.toFixed(3)} vs flat ${fit.loo_flat.toFixed(3)}, ` +
      `split ${Number.isFinite(fit.split_fit) ? fit.split_fit.toFixed(3) : 'n/a'} vs flat ${Number.isFinite(fit.split_flat) ? fit.split_flat.toFixed(3) : 'n/a'}, used_flat=${fit.used_flat}`,
  );
  console.log(`rates: cohort ${rates.cohort_n}, overall ${(rates.overall_rate * 100).toFixed(1)}%, hazard ${rates.hazard_per_year.toFixed(3)}/yr; ${rates.adopted_note}`);
}

main();
