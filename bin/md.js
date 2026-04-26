"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.installMdTemplates = installMdTemplates;
exports.runMd = runMd;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
// --- Paths ---
const PRESET_DIR = path.join(utils_1.PACKAGE_ROOT, 'presets', 'md');
const USER_LIBRARY_MD_DIR = path.join(utils_1.HOME_DIR, '.claude', 'library', 'md');
// --- Helpers ---
function listTemplates() {
    try {
        return fs.readdirSync(PRESET_DIR)
            .filter(f => f.endsWith('.md'))
            .map(f => f.replace(/\.md$/, ''))
            .sort();
    }
    catch {
        return [];
    }
}
function templateFilename(name) {
    return name.toUpperCase() + '.md';
}
// --- Programmatic API (used by cup init) ---
function installMdTemplates(opts) {
    if (listTemplates().length === 0)
        return null;
    return (0, utils_1.syncDirectory)(PRESET_DIR, USER_LIBRARY_MD_DIR, opts.force ?? false, f => f.endsWith('.md')).counts;
}
// --- Help ---
function showMdHelp() {
    (0, ui_1.renderBanner)();
    const c = ui_1.C.cyan;
    const b = ui_1.C.bold;
    const g = ui_1.C.gray;
    console.log(`  ${(0, ui_1.style)('Usage:', b)} cup md <template> [options]\n`);
    console.log(`  ${(0, ui_1.style)('Options', b)}`);
    console.log(`    ${(0, ui_1.style)('--output=<path>', g)} Output file path (default: ./<TEMPLATE>.md in cwd)`);
    console.log(`    ${(0, ui_1.style)('--force, -f', g)}     Overwrite existing without backup`);
    console.log(`    ${(0, ui_1.style)('--yes, -y', g)}       Skip confirmation\n`);
    console.log(`  ${(0, ui_1.style)('Subcommands', b)}`);
    console.log(`    ${(0, ui_1.style)('list', c)}             Show available templates`);
    console.log(`    ${(0, ui_1.style)('help', c)}             Show this message\n`);
    const templates = listTemplates();
    if (templates.length > 0) {
        console.log(`  ${(0, ui_1.style)('Available templates', b)}`);
        for (const t of templates) {
            console.log(`    ${(0, ui_1.style)(t.padEnd(12), c)} → ${(0, ui_1.style)(`./${templateFilename(t)}`, g)}`);
        }
        console.log('');
    }
    console.log(`  ${(0, ui_1.style)('Notes', b)}`);
    console.log(`    ${(0, ui_1.style)('•', g)} ${(0, ui_1.style)('design', c)} template follows Stitch DESIGN.md spec (frontmatter tokens + canonical sections)`);
    console.log(`    ${(0, ui_1.style)('•', g)} ${(0, ui_1.style)('cup init', c)} also installs all templates to ${(0, ui_1.style)('~/.claude/library/md/', g)} as user-level reference\n`);
}
// --- List ---
function runMdList() {
    (0, ui_1.renderBanner)();
    const templates = listTemplates();
    console.log(`  ${(0, ui_1.style)('Available md templates', ui_1.C.bold)}`);
    console.log(`  ${(0, ui_1.style)(`Source: ${PRESET_DIR}`, ui_1.C.gray)}\n`);
    if (templates.length === 0) {
        console.log(`  ${(0, ui_1.style)('(no templates)', ui_1.C.gray)}\n`);
        return;
    }
    for (const t of templates) {
        console.log(`    ${(0, ui_1.style)('•', ui_1.C.gray)} ${(0, ui_1.style)(t, ui_1.C.cyan)}  →  ./${templateFilename(t)}`);
    }
    console.log('');
}
// --- Get ---
async function runMdGet(name, opts) {
    (0, ui_1.renderBanner)();
    const templates = listTemplates();
    if (!templates.includes(name)) {
        console.error(`  ${(0, ui_1.style)('ERROR:', ui_1.C.red)} unknown template: ${name}`);
        console.error(`  Available: ${templates.join(', ') || '(none)'}\n`);
        process.exit(1);
    }
    const src = path.join(PRESET_DIR, `${name}.md`);
    const dest = opts.output || path.join(process.cwd(), templateFilename(name));
    if (fs.existsSync(dest) && !opts.force) {
        if (!opts.yes) {
            const ok = await (0, ui_1.ask)(`${dest} exists. Overwrite? (backup will be made)`, false);
            if (!ok) {
                console.log(`  ${(0, ui_1.style)('Aborted.', ui_1.C.gray)}\n`);
                return;
            }
        }
        (0, utils_1.backup)(dest);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`  ${(0, ui_1.style)('✓', ui_1.C.green)} ${templateFilename(name)} written to ${(0, ui_1.style)(dest, ui_1.C.cyan)}\n`);
}
// --- Router ---
async function runMd(subcommand, opts) {
    if (!subcommand || subcommand === 'help') {
        showMdHelp();
        return;
    }
    if (subcommand === 'list') {
        runMdList();
        return;
    }
    await runMdGet(subcommand, opts);
}
