import * as fs from 'fs';
import * as path from 'path';
import { renderBanner, ask, C, style } from './ui';
import { PACKAGE_ROOT, HOME_DIR, backup, syncDirectory } from './utils';
import type { SyncCounts } from './utils';
import type { Opts } from './installer';

// --- Paths ---

const PRESET_DIR = path.join(PACKAGE_ROOT, 'presets', 'md');
const USER_LIBRARY_MD_DIR = path.join(HOME_DIR, '.claude', 'library', 'md');

// --- Helpers ---

function listTemplates(): string[] {
  try {
    return fs.readdirSync(PRESET_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/\.md$/, ''))
      .sort();
  } catch { return []; }
}

function templateFilename(name: string): string {
  return name.toUpperCase() + '.md';
}

// --- Programmatic API (used by cup init) ---

export function installMdTemplates(opts: { force?: boolean }): SyncCounts | null {
  if (listTemplates().length === 0) return null;
  return syncDirectory(PRESET_DIR, USER_LIBRARY_MD_DIR, opts.force ?? false, f => f.endsWith('.md')).counts;
}

// --- Help ---

function showMdHelp(): void {
  renderBanner();
  const c = C.cyan;
  const b = C.bold;
  const g = C.gray;

  console.log(`  ${style('Usage:', b)} cup md <template> [options]\n`);

  console.log(`  ${style('Options', b)}`);
  console.log(`    ${style('--output=<path>', g)} Output file path (default: ./<TEMPLATE>.md in cwd)`);
  console.log(`    ${style('--force, -f', g)}     Overwrite existing without backup`);
  console.log(`    ${style('--yes, -y', g)}       Skip confirmation\n`);

  console.log(`  ${style('Subcommands', b)}`);
  console.log(`    ${style('list', c)}             Show available templates`);
  console.log(`    ${style('help', c)}             Show this message\n`);

  const templates = listTemplates();
  if (templates.length > 0) {
    console.log(`  ${style('Available templates', b)}`);
    for (const t of templates) {
      console.log(`    ${style(t.padEnd(12), c)} → ${style(`./${templateFilename(t)}`, g)}`);
    }
    console.log('');
  }

  console.log(`  ${style('Notes', b)}`);
  console.log(`    ${style('•', g)} ${style('design', c)} template follows Stitch DESIGN.md spec (frontmatter tokens + canonical sections)`);
  console.log(`    ${style('•', g)} ${style('cup init', c)} also installs all templates to ${style('~/.claude/library/md/', g)} as user-level reference\n`);
}

// --- List ---

function runMdList(): void {
  renderBanner();
  const templates = listTemplates();
  console.log(`  ${style('Available md templates', C.bold)}`);
  console.log(`  ${style(`Source: ${PRESET_DIR}`, C.gray)}\n`);
  if (templates.length === 0) {
    console.log(`  ${style('(no templates)', C.gray)}\n`);
    return;
  }
  for (const t of templates) {
    console.log(`    ${style('•', C.gray)} ${style(t, C.cyan)}  →  ./${templateFilename(t)}`);
  }
  console.log('');
}

// --- Get ---

async function runMdGet(name: string, opts: Opts): Promise<void> {
  renderBanner();
  const templates = listTemplates();
  if (!templates.includes(name)) {
    console.error(`  ${style('ERROR:', C.red)} unknown template: ${name}`);
    console.error(`  Available: ${templates.join(', ') || '(none)'}\n`);
    process.exit(1);
  }

  const src = path.join(PRESET_DIR, `${name}.md`);
  const dest = opts.output || path.join(process.cwd(), templateFilename(name));

  if (fs.existsSync(dest) && !opts.force) {
    if (!opts.yes) {
      const ok = await ask(`${dest} exists. Overwrite? (backup will be made)`, false);
      if (!ok) { console.log(`  ${style('Aborted.', C.gray)}\n`); return; }
    }
    backup(dest);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ${style('✓', C.green)} ${templateFilename(name)} written to ${style(dest, C.cyan)}\n`);
}

// --- Router ---

export async function runMd(subcommand: string | undefined, opts: Opts): Promise<void> {
  if (!subcommand || subcommand === 'help') { showMdHelp(); return; }
  if (subcommand === 'list') { runMdList(); return; }
  await runMdGet(subcommand, opts);
}
