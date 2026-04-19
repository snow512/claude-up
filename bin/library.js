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
exports.runLibraryCollect = exports.runLibraryInstall = void 0;
exports.installPresetLibrary = installPresetLibrary;
exports.runLibraryList = runLibraryList;
exports.runLibrary = runLibrary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ui_1 = require("./ui");
const utils_1 = require("./utils");
// --- Paths ---
const PRESET_DIR = path.join(utils_1.PACKAGE_ROOT, 'presets', 'library');
const USER_DIR = path.join(utils_1.HOME_DIR, '.claude', 'library');
// --- Helpers ---
function listFiles(dir) {
    try {
        return fs.readdirSync(dir).filter(f => !f.startsWith('.')).sort();
    }
    catch {
        return [];
    }
}
function sameContent(a, b) {
    try {
        return fs.readFileSync(a).equals(fs.readFileSync(b));
    }
    catch {
        return false;
    }
}
function copyFile(src, dest, force) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        return 'created';
    }
    if (sameContent(src, dest))
        return 'unchanged';
    if (!force)
        (0, utils_1.backup)(dest);
    fs.copyFileSync(src, dest);
    return 'updated';
}
function syncDir(srcDir, dstDir, force) {
    const files = listFiles(srcDir);
    fs.mkdirSync(dstDir, { recursive: true });
    const counts = { created: 0, updated: 0, unchanged: 0 };
    const reports = [];
    for (const f of files) {
        const result = copyFile(path.join(srcDir, f), path.join(dstDir, f), force);
        counts[result]++;
        reports.push({ file: f, result });
    }
    return { counts, reports };
}
function tagFor(result) {
    if (result === 'created')
        return (0, ui_1.style)('+', ui_1.C.green);
    if (result === 'updated')
        return (0, ui_1.style)('~', ui_1.C.yellow);
    return (0, ui_1.style)('=', ui_1.C.gray);
}
// --- Programmatic API (used by cup init) ---
async function installPresetLibrary(opts) {
    const files = listFiles(PRESET_DIR);
    if (files.length === 0)
        return null;
    if (!opts.yes) {
        const ok = await (0, ui_1.ask)(`Install ${files.length} library file(s) to ${USER_DIR}?`, true);
        if (!ok)
            return null;
    }
    return syncDir(PRESET_DIR, USER_DIR, opts.force ?? false).counts;
}
// --- Help ---
function showLibraryHelp() {
    (0, ui_1.renderBanner)();
    const c = ui_1.C.cyan;
    const b = ui_1.C.bold;
    const g = ui_1.C.gray;
    console.log(`  ${(0, ui_1.style)('Usage:', b)} cup library <subcommand> [options]\n`);
    console.log(`  ${(0, ui_1.style)('Subcommands', b)}`);
    console.log(`    ${(0, ui_1.style)('install', c)}           Copy preset library files → ${(0, ui_1.style)(USER_DIR, g)}`);
    console.log(`      ${(0, ui_1.style)('--force, -f', g)}     Overwrite without backup`);
    console.log(`      ${(0, ui_1.style)('--yes, -y', g)}       Skip confirmation`);
    console.log(`    ${(0, ui_1.style)('collect', c)}           Copy ${(0, ui_1.style)(USER_DIR, g)} → preset library files`);
    console.log(`      ${(0, ui_1.style)('--force, -f', g)}     Overwrite without backup`);
    console.log(`      ${(0, ui_1.style)('--yes, -y', g)}       Skip confirmation`);
    console.log(`    ${(0, ui_1.style)('list', c)}              Show file inventory + diff status (preset vs user)\n`);
    console.log(`  ${(0, ui_1.style)('Notes', b)}`);
    console.log(`    ${(0, ui_1.style)('•', g)} Library files are reference docs (design-guide, emoji rules, etc.)`);
    console.log(`    ${(0, ui_1.style)('•', g)} install/collect copy whole files; no marker-block merging`);
    console.log(`    ${(0, ui_1.style)('•', g)} Existing target file is backed up to .bak.<ts> before overwrite (unless --force)\n`);
}
// --- Sync runner (shared by install + collect) ---
async function runSync(opts, direction) {
    (0, ui_1.renderBanner)();
    const isInstall = direction === 'install';
    const srcDir = isInstall ? PRESET_DIR : USER_DIR;
    const dstDir = isInstall ? USER_DIR : PRESET_DIR;
    const sourceLabel = isInstall ? 'preset' : 'user';
    const files = listFiles(srcDir);
    if (files.length === 0) {
        console.log(`  ${(0, ui_1.style)(`No ${sourceLabel} library files found:`, ui_1.C.red)} ${srcDir}\n`);
        process.exit(1);
    }
    console.log(`  ${(0, ui_1.style)('Source:', ui_1.C.bold)} ${(0, ui_1.style)(srcDir, ui_1.C.gray)}`);
    console.log(`  ${(0, ui_1.style)('Target:', ui_1.C.bold)} ${(0, ui_1.style)(dstDir, ui_1.C.gray)}`);
    console.log(`  ${(0, ui_1.style)('Files:', ui_1.C.bold)} ${files.length}\n`);
    if (!opts.yes) {
        const verb = isInstall ? 'Install' : 'Collect';
        const preposition = isInstall ? 'to' : 'into';
        const ok = await (0, ui_1.ask)(`${verb} ${files.length} file(s) ${preposition} ${dstDir}?`, true);
        if (!ok) {
            console.log(`  ${(0, ui_1.style)('Aborted.', ui_1.C.gray)}\n`);
            return;
        }
    }
    const { counts, reports } = syncDir(srcDir, dstDir, opts.force ?? false);
    for (const r of reports) {
        console.log(`  ${tagFor(r.result)} ${r.file} ${(0, ui_1.style)(r.result, ui_1.C.gray)}`);
    }
    console.log(`\n  ${(0, ui_1.style)('✓', ui_1.C.green)} ${counts.created} created, ${counts.updated} updated, ${counts.unchanged} unchanged\n`);
}
const runLibraryInstall = (opts) => runSync(opts, 'install');
exports.runLibraryInstall = runLibraryInstall;
const runLibraryCollect = (opts) => runSync(opts, 'collect');
exports.runLibraryCollect = runLibraryCollect;
// --- List ---
function runLibraryList() {
    (0, ui_1.renderBanner)();
    const presetFiles = listFiles(PRESET_DIR);
    const userFiles = listFiles(USER_DIR);
    const all = Array.from(new Set([...presetFiles, ...userFiles])).sort();
    console.log(`  ${(0, ui_1.style)('Preset:', ui_1.C.bold)} ${(0, ui_1.style)(PRESET_DIR, ui_1.C.gray)}`);
    console.log(`  ${(0, ui_1.style)('User:  ', ui_1.C.bold)} ${(0, ui_1.style)(USER_DIR, ui_1.C.gray)}\n`);
    if (all.length === 0) {
        console.log(`  ${(0, ui_1.style)('(no files in either location)', ui_1.C.gray)}\n`);
        return;
    }
    for (const f of all) {
        const inPreset = presetFiles.includes(f);
        const inUser = userFiles.includes(f);
        let status;
        let color;
        if (inPreset && inUser) {
            const same = sameContent(path.join(PRESET_DIR, f), path.join(USER_DIR, f));
            status = same ? '= same' : '~ differ';
            color = same ? ui_1.C.gray : ui_1.C.yellow;
        }
        else if (inPreset) {
            status = '+ preset only (run install)';
            color = ui_1.C.green;
        }
        else {
            status = '+ user only (run collect)';
            color = ui_1.C.cyan;
        }
        console.log(`    ${(0, ui_1.style)(f.padEnd(24), ui_1.C.bold)} ${(0, ui_1.style)(status, color)}`);
    }
    console.log('');
}
// --- Router ---
async function runLibrary(subcommand, opts) {
    switch (subcommand) {
        case 'install':
            await (0, exports.runLibraryInstall)(opts);
            break;
        case 'collect':
            await (0, exports.runLibraryCollect)(opts);
            break;
        case 'list':
            runLibraryList();
            break;
        case undefined:
        case 'help':
            showLibraryHelp();
            break;
        default:
            console.error(`  ${(0, ui_1.style)('Unknown subcommand:', ui_1.C.red)} ${subcommand}`);
            console.error(`  Run ${(0, ui_1.style)('cup library', ui_1.C.cyan)} for usage\n`);
            process.exit(1);
    }
}
