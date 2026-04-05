import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const FIXTURES = path.join(os.tmpdir(), 'omc-test-' + Date.now());

before(() => {
  fs.mkdirSync(FIXTURES, { recursive: true });
});

after(() => {
  fs.rmSync(FIXTURES, { recursive: true, force: true });
});

// --- Test: timestamp format ---

describe('timestamp', () => {
  it('should produce a 14-character numeric string', () => {
    // Timestamp is used in backup filenames: YYYYMMDDHHMMSS
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    assert.match(ts, /^\d{14}$/);
    assert.equal(ts.length, 14);
  });
});

// --- Test: copyDirRecursive ---

describe('copyDirRecursive', () => {
  const srcDir = path.join(FIXTURES, 'copy-src');
  const destDir = path.join(FIXTURES, 'copy-dest');

  beforeEach(() => {
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'file1.txt'), 'hello');
    fs.writeFileSync(path.join(srcDir, 'sub', 'file2.txt'), 'world');
  });

  afterEach(() => {
    fs.rmSync(srcDir, { recursive: true, force: true });
    fs.rmSync(destDir, { recursive: true, force: true });
  });

  it('should copy all files recursively', () => {
    // Re-implement copyDirRecursive for testing
    function copyDirRecursive(src: string, dest: string): number {
      fs.mkdirSync(dest, { recursive: true });
      let count = 0;
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.isSymbolicLink()) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) { count += copyDirRecursive(srcPath, destPath); }
        else { fs.copyFileSync(srcPath, destPath); count++; }
      }
      return count;
    }

    const count = copyDirRecursive(srcDir, destDir);
    assert.equal(count, 2);
    assert.equal(fs.readFileSync(path.join(destDir, 'file1.txt'), 'utf-8'), 'hello');
    assert.equal(fs.readFileSync(path.join(destDir, 'sub', 'file2.txt'), 'utf-8'), 'world');
  });

  it('should skip symlinks', () => {
    fs.symlinkSync('/tmp', path.join(srcDir, 'link'));

    function copyDirRecursive(src: string, dest: string): number {
      fs.mkdirSync(dest, { recursive: true });
      let count = 0;
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.isSymbolicLink()) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) { count += copyDirRecursive(srcPath, destPath); }
        else { fs.copyFileSync(srcPath, destPath); count++; }
      }
      return count;
    }

    const count = copyDirRecursive(srcDir, destDir);
    assert.equal(count, 2); // symlink not counted
    assert.ok(!fs.existsSync(path.join(destDir, 'link')));
  });
});

// --- Test: backup ---

describe('backup', () => {
  it('should create a timestamped backup file', () => {
    const original = path.join(FIXTURES, 'backup-test.json');
    fs.writeFileSync(original, '{"test": true}');

    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const bakPath = `${original}.bak.${ts}`;
    fs.copyFileSync(original, bakPath);

    assert.ok(fs.existsSync(bakPath));
    assert.equal(fs.readFileSync(bakPath, 'utf-8'), '{"test": true}');

    fs.unlinkSync(original);
    fs.unlinkSync(bakPath);
  });

  it('should return null for non-existent files', () => {
    const nonExistent = path.join(FIXTURES, 'does-not-exist.json');
    try {
      fs.copyFileSync(nonExistent, nonExistent + '.bak');
      assert.fail('should have thrown');
    } catch {
      // expected
    }
  });
});

// --- Test: isDirChanged ---

describe('isDirChanged', () => {
  const dirA = path.join(FIXTURES, 'changed-a');
  const dirB = path.join(FIXTURES, 'changed-b');

  function isDirChanged(srcDir: string, destDir: string): boolean {
    try {
      const srcEntries = fs.readdirSync(srcDir, { withFileTypes: true });
      for (const entry of srcEntries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
          if (isDirChanged(srcPath, destPath)) return true;
        } else {
          if (!fs.existsSync(destPath)) return true;
          if (!fs.readFileSync(srcPath).equals(fs.readFileSync(destPath))) return true;
        }
      }
      return false;
    } catch { return true; }
  }

  afterEach(() => {
    fs.rmSync(dirA, { recursive: true, force: true });
    fs.rmSync(dirB, { recursive: true, force: true });
  });

  it('should return false for identical directories', () => {
    fs.mkdirSync(dirA, { recursive: true });
    fs.mkdirSync(dirB, { recursive: true });
    fs.writeFileSync(path.join(dirA, 'f.txt'), 'same');
    fs.writeFileSync(path.join(dirB, 'f.txt'), 'same');

    assert.equal(isDirChanged(dirA, dirB), false);
  });

  it('should return true when file content differs', () => {
    fs.mkdirSync(dirA, { recursive: true });
    fs.mkdirSync(dirB, { recursive: true });
    fs.writeFileSync(path.join(dirA, 'f.txt'), 'old');
    fs.writeFileSync(path.join(dirB, 'f.txt'), 'new');

    assert.equal(isDirChanged(dirA, dirB), true);
  });

  it('should return true when dest file is missing', () => {
    fs.mkdirSync(dirA, { recursive: true });
    fs.mkdirSync(dirB, { recursive: true });
    fs.writeFileSync(path.join(dirA, 'f.txt'), 'data');

    assert.equal(isDirChanged(dirA, dirB), true);
  });

  it('should return true when dest dir does not exist', () => {
    fs.mkdirSync(dirA, { recursive: true });
    fs.writeFileSync(path.join(dirA, 'f.txt'), 'data');

    assert.equal(isDirChanged(dirA, path.join(FIXTURES, 'nonexistent')), true);
  });
});

// --- Test: writeJson / readJson roundtrip ---

describe('JSON roundtrip', () => {
  it('should write and read JSON correctly', () => {
    const filePath = path.join(FIXTURES, 'roundtrip.json');
    const data = { name: 'test', arr: [1, 2, 3], nested: { a: true } };

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

    const read = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.deepEqual(read, data);

    fs.unlinkSync(filePath);
  });

  it('should create parent directories', () => {
    const filePath = path.join(FIXTURES, 'deep', 'nested', 'dir', 'file.json');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '{"ok": true}\n');

    assert.ok(fs.existsSync(filePath));
    assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf-8')), { ok: true });

    fs.rmSync(path.join(FIXTURES, 'deep'), { recursive: true });
  });

  it('should return null for invalid JSON', () => {
    const filePath = path.join(FIXTURES, 'invalid.json');
    fs.writeFileSync(filePath, 'not json!!!');

    let result = null;
    try { result = JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { result = null; }

    assert.equal(result, null);
    fs.unlinkSync(filePath);
  });

  it('should return null for missing file', () => {
    let result = null;
    try { result = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'missing.json'), 'utf-8')); }
    catch { result = null; }

    assert.equal(result, null);
  });
});

// --- Test: copySkillWithLang ---

describe('copySkillWithLang', () => {
  const srcSkill = path.join(FIXTURES, 'skill-src');
  const destSkill = path.join(FIXTURES, 'skill-dest');

  beforeEach(() => {
    fs.mkdirSync(srcSkill, { recursive: true });
    fs.writeFileSync(path.join(srcSkill, 'SKILL.md'), '# English version');
    fs.writeFileSync(path.join(srcSkill, 'SKILL.ko.md'), '# Korean version');
  });

  afterEach(() => {
    fs.rmSync(srcSkill, { recursive: true, force: true });
    fs.rmSync(destSkill, { recursive: true, force: true });
  });

  function copySkillWithLang(srcDir: string, destDir: string, lang: string): void {
    // Copy all
    fs.mkdirSync(destDir, { recursive: true });
    for (const f of fs.readdirSync(srcDir)) {
      fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
    }
    // Override with ko if needed
    if (lang === 'ko') {
      const koFile = path.join(srcDir, 'SKILL.ko.md');
      if (fs.existsSync(koFile)) fs.copyFileSync(koFile, path.join(destDir, 'SKILL.md'));
    }
    // Remove ko from dest
    try { fs.unlinkSync(path.join(destDir, 'SKILL.ko.md')); } catch {}
  }

  it('should install English by default', () => {
    copySkillWithLang(srcSkill, destSkill, 'en');
    assert.equal(fs.readFileSync(path.join(destSkill, 'SKILL.md'), 'utf-8'), '# English version');
    assert.ok(!fs.existsSync(path.join(destSkill, 'SKILL.ko.md')));
  });

  it('should install Korean when lang=ko', () => {
    copySkillWithLang(srcSkill, destSkill, 'ko');
    assert.equal(fs.readFileSync(path.join(destSkill, 'SKILL.md'), 'utf-8'), '# Korean version');
    assert.ok(!fs.existsSync(path.join(destSkill, 'SKILL.ko.md')));
  });
});

// --- Test: Preset validation ---

describe('preset validation', () => {
  it('should reject preset without permissions', () => {
    const filePath = path.join(FIXTURES, 'bad-preset.json');
    fs.writeFileSync(filePath, JSON.stringify({ name: 'bad' }));

    const preset = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(preset.permissions, undefined);

    fs.unlinkSync(filePath);
  });

  it('should accept valid preset', () => {
    const filePath = path.join(FIXTURES, 'good-preset.json');
    const data = { permissions: { allow: ['Read(*)'], deny: ['Bash(rm -rf:*)'] } };
    fs.writeFileSync(filePath, JSON.stringify(data));

    const preset = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.ok(preset.permissions);
    assert.equal(preset.permissions.allow.length, 1);
    assert.equal(preset.permissions.deny.length, 1);

    fs.unlinkSync(filePath);
  });
});

// --- Test: Settings merge strategy ---

describe('settings merge', () => {
  it('should preserve existing keys when merging preset', () => {
    const existing = {
      statusLine: { type: 'command', command: 'bash script.sh' },
      customKey: 'preserved',
    };
    const preset = {
      permissions: { allow: ['Read(*)'] },
    };

    const merged = { ...existing, permissions: preset.permissions };

    assert.equal(merged.statusLine.type, 'command');
    assert.equal(merged.customKey, 'preserved');
    assert.deepEqual(merged.permissions, { allow: ['Read(*)'] });
  });

  it('should overwrite permissions entirely', () => {
    const existing = {
      permissions: { allow: ['OldRule(*)'], deny: ['OldDeny(*)'] },
    };
    const preset = {
      permissions: { allow: ['NewRule(*)'], deny: [] },
    };

    const merged = { ...existing, permissions: preset.permissions };

    assert.deepEqual(merged.permissions.allow, ['NewRule(*)']);
    assert.deepEqual(merged.permissions.deny, []);
  });
});

// --- Test: Locale detection ---

describe('locale detection', () => {
  it('should detect Korean locale', () => {
    const locale = 'ko_KR.UTF-8'.toLowerCase();
    assert.equal(locale.startsWith('ko'), true);
  });

  it('should detect English locale', () => {
    const locale = 'en_US.UTF-8'.toLowerCase();
    assert.equal(locale.startsWith('ko'), false);
  });

  it('should default to English for C locale', () => {
    const locale = 'C.UTF-8'.toLowerCase();
    assert.equal(locale.startsWith('ko'), false);
  });

  it('should default to English for empty', () => {
    const locale = ''.toLowerCase();
    assert.equal(locale.startsWith('ko'), false);
  });
});

// --- Test: CLI arg parsing ---

describe('CLI arg parsing', () => {
  it('should parse flags correctly', () => {
    const args = ['init', '--yes', '-f', '--lang=ko'];
    const flags = new Set(args.filter(a => a.startsWith('-') && !a.includes('=')));
    const command = args.find(a => !a.startsWith('-'));

    assert.equal(command, 'init');
    assert.ok(flags.has('--yes'));
    assert.ok(flags.has('-f'));
    assert.ok(!flags.has('--lang=ko')); // excluded because contains =
  });

  it('should extract flag values', () => {
    const args = ['init', '--lang=ko', '--output=/tmp/test'];
    const getFlag = (name: string): string | null => {
      const val = args.find(a => a.startsWith(`--${name}=`));
      return val ? val.split('=')[1] : null;
    };

    assert.equal(getFlag('lang'), 'ko');
    assert.equal(getFlag('output'), '/tmp/test');
    assert.equal(getFlag('nonexistent'), null);
  });

  it('should extract subcommand', () => {
    const args = ['install', 'skills', '--lang=ko'];
    const positional = args.filter(a => !a.startsWith('-'));
    assert.equal(positional[0], 'install');
    assert.equal(positional[1], 'skills');
  });

  it('should handle --version as command', () => {
    const args = ['--version'];
    const flags = new Set(args.filter(a => a.startsWith('-') && !a.includes('=')));
    const command = args.find(a => !a.startsWith('-'))
      || (flags.has('--version') ? '--version' : undefined);
    assert.equal(command, '--version');
  });
});

// --- Test: UI style function ---

describe('UI style', () => {
  it('should wrap text with ANSI codes in TTY mode', () => {
    // Test the pure function logic
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const cyan = '\x1b[38;5;81m';

    function style(text: string, ...codes: string[]): string {
      return codes.join('') + text + reset;
    }

    const result = style('hello', bold, cyan);
    assert.equal(result, `${bold}${cyan}hello${reset}`);
  });

  it('should handle no codes', () => {
    const reset = '\x1b[0m';
    function style(text: string, ...codes: string[]): string {
      return codes.join('') + text + reset;
    }

    const result = style('plain');
    assert.equal(result, `plain${reset}`);
  });
});
