import * as fs from 'fs';
import * as path from 'path';
import { renderBanner, ask, C, style } from './ui';
import { PACKAGE_ROOT, HOME_DIR, backup } from './utils';
import type { Opts } from './installer';

// --- Paths ---

const PRESET_DIR = path.join(PACKAGE_ROOT, 'presets', 'library');
const USER_DIR = path.join(HOME_DIR, '.claude', 'library');

// --- Types ---

type CopyResult = 'created' | 'updated' | 'unchanged';

export interface LibrarySyncCounts {
  created: number;
  updated: number;
  unchanged: number;
}

interface SyncOutcome {
  counts: LibrarySyncCounts;
  reports: Array<{ file: string; result: CopyResult }>;
}

// --- Helpers ---

function listFiles(dir: string): string[] {
  try { return fs.readdirSync(dir).filter(f => !f.startsWith('.')).sort(); }
  catch { return []; }
}

function sameContent(a: string, b: string): boolean {
  try { return fs.readFileSync(a).equals(fs.readFileSync(b)); }
  catch { return false; }
}

function copyFile(src: string, dest: string, force: boolean): CopyResult {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    return 'created';
  }
  if (sameContent(src, dest)) return 'unchanged';
  if (!force) backup(dest);
  fs.copyFileSync(src, dest);
  return 'updated';
}

function syncDir(srcDir: string, dstDir: string, force: boolean): SyncOutcome {
  const files = listFiles(srcDir);
  fs.mkdirSync(dstDir, { recursive: true });
  const counts: LibrarySyncCounts = { created: 0, updated: 0, unchanged: 0 };
  const reports: SyncOutcome['reports'] = [];
  for (const f of files) {
    const result = copyFile(path.join(srcDir, f), path.join(dstDir, f), force);
    counts[result]++;
    reports.push({ file: f, result });
  }
  return { counts, reports };
}

function tagFor(result: CopyResult): string {
  if (result === 'created') return style('+', C.green);
  if (result === 'updated') return style('~', C.yellow);
  return style('=', C.gray);
}

// --- Programmatic API (used by cup init) ---

export async function installPresetLibrary(opts: { yes?: boolean; force?: boolean }): Promise<LibrarySyncCounts | null> {
  const files = listFiles(PRESET_DIR);
  if (files.length === 0) return null;

  if (!opts.yes) {
    const ok = await ask(`Install ${files.length} library file(s) to ${USER_DIR}?`, true);
    if (!ok) return null;
  }

  return syncDir(PRESET_DIR, USER_DIR, opts.force ?? false).counts;
}

// --- Help ---

function showLibraryHelp(): void {
  renderBanner();
  const c = C.cyan;
  const b = C.bold;
  const g = C.gray;

  console.log(`  ${style('Usage:', b)} cup library <subcommand> [options]\n`);

  console.log(`  ${style('Subcommands', b)}`);
  console.log(`    ${style('install', c)}           Copy preset library files → ${style(USER_DIR, g)}`);
  console.log(`      ${style('--force, -f', g)}     Overwrite without backup`);
  console.log(`      ${style('--yes, -y', g)}       Skip confirmation`);
  console.log(`    ${style('collect', c)}           Copy ${style(USER_DIR, g)} → preset library files`);
  console.log(`      ${style('--force, -f', g)}     Overwrite without backup`);
  console.log(`      ${style('--yes, -y', g)}       Skip confirmation`);
  console.log(`    ${style('list', c)}              Show file inventory + diff status (preset vs user)\n`);

  console.log(`  ${style('Notes', b)}`);
  console.log(`    ${style('•', g)} Library files are reference docs (design-guide, emoji rules, etc.)`);
  console.log(`    ${style('•', g)} install/collect copy whole files; no marker-block merging`);
  console.log(`    ${style('•', g)} Existing target file is backed up to .bak.<ts> before overwrite (unless --force)\n`);
}

// --- Sync runner (shared by install + collect) ---

async function runSync(opts: Opts, direction: 'install' | 'collect'): Promise<void> {
  renderBanner();

  const isInstall = direction === 'install';
  const srcDir = isInstall ? PRESET_DIR : USER_DIR;
  const dstDir = isInstall ? USER_DIR : PRESET_DIR;
  const sourceLabel = isInstall ? 'preset' : 'user';

  const files = listFiles(srcDir);
  if (files.length === 0) {
    console.log(`  ${style(`No ${sourceLabel} library files found:`, C.red)} ${srcDir}\n`);
    process.exit(1);
  }

  console.log(`  ${style('Source:', C.bold)} ${style(srcDir, C.gray)}`);
  console.log(`  ${style('Target:', C.bold)} ${style(dstDir, C.gray)}`);
  console.log(`  ${style('Files:', C.bold)} ${files.length}\n`);

  if (!opts.yes) {
    const verb = isInstall ? 'Install' : 'Collect';
    const preposition = isInstall ? 'to' : 'into';
    const ok = await ask(`${verb} ${files.length} file(s) ${preposition} ${dstDir}?`, true);
    if (!ok) { console.log(`  ${style('Aborted.', C.gray)}\n`); return; }
  }

  const { counts, reports } = syncDir(srcDir, dstDir, opts.force ?? false);
  for (const r of reports) {
    console.log(`  ${tagFor(r.result)} ${r.file} ${style(r.result, C.gray)}`);
  }
  console.log(`\n  ${style('✓', C.green)} ${counts.created} created, ${counts.updated} updated, ${counts.unchanged} unchanged\n`);
}

export const runLibraryInstall = (opts: Opts): Promise<void> => runSync(opts, 'install');
export const runLibraryCollect = (opts: Opts): Promise<void> => runSync(opts, 'collect');

// --- List ---

export function runLibraryList(): void {
  renderBanner();

  const presetFiles = listFiles(PRESET_DIR);
  const userFiles = listFiles(USER_DIR);
  const all = Array.from(new Set([...presetFiles, ...userFiles])).sort();

  console.log(`  ${style('Preset:', C.bold)} ${style(PRESET_DIR, C.gray)}`);
  console.log(`  ${style('User:  ', C.bold)} ${style(USER_DIR, C.gray)}\n`);

  if (all.length === 0) {
    console.log(`  ${style('(no files in either location)', C.gray)}\n`);
    return;
  }

  for (const f of all) {
    const inPreset = presetFiles.includes(f);
    const inUser = userFiles.includes(f);
    let status: string;
    let color: string;
    if (inPreset && inUser) {
      const same = sameContent(path.join(PRESET_DIR, f), path.join(USER_DIR, f));
      status = same ? '= same' : '~ differ';
      color = same ? C.gray : C.yellow;
    } else if (inPreset) {
      status = '+ preset only (run install)';
      color = C.green;
    } else {
      status = '+ user only (run collect)';
      color = C.cyan;
    }
    console.log(`    ${style(f.padEnd(24), C.bold)} ${style(status, color)}`);
  }
  console.log('');
}

// --- Router ---

export async function runLibrary(subcommand: string | undefined, opts: Opts): Promise<void> {
  switch (subcommand) {
    case 'install':
      await runLibraryInstall(opts);
      break;
    case 'collect':
      await runLibraryCollect(opts);
      break;
    case 'list':
      runLibraryList();
      break;
    case undefined:
    case 'help':
      showLibraryHelp();
      break;
    default:
      console.error(`  ${style('Unknown subcommand:', C.red)} ${subcommand}`);
      console.error(`  Run ${style('cup library', C.cyan)} for usage\n`);
      process.exit(1);
  }
}
