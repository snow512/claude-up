# oh-my-claude

Bootstrap and manage your Claude Code environment — npm CLI + Claude plugin hybrid.

Sets up user-level permissions, installs curated plugins, and deploys skills with a single command. Works both from the terminal (new machine setup) and from inside a Claude session (Korean trigger commands included).

---

## Quick Start

### New machine setup (terminal)

```bash
# Set up user-level Claude Code settings & skills
npx oh-my-claude init

# Set up project-level permissions (run inside a project directory)
npx oh-my-claude project-init
```

### Inside a Claude Code session

After installing the plugin, trigger commands with natural language:

| What you type | What runs |
|---|---|
| `클로드초기설정해` / `환경설정해` / `setup` | `/claude-init` → `npx oh-my-claude init` |
| `프로젝트초기설정해` / `권한설정해` | `/project-init` → `npx oh-my-claude project-init` |

---

## Commands

### `oh-my-claude init`

Sets up your **user-level** Claude Code environment:

- Merges `presets/user.json` into `~/.claude/settings.json`
  - Applies permission allow/deny rules (safe defaults: no `rm -rf`, no force push, etc.)
  - Enables 14 curated plugins from the official marketplace
  - Registers the official plugin marketplace
- Copies all skills from `user-skills/` to `~/.claude/skills/`
- Backs up any existing `settings.json` before overwriting

```
oh-my-claude init

[설정]
  ✅ permissions: allow 10개, deny 7개
  ✅ enabledPlugins: 14개
  ✅ marketplaces: claude-plugins-official

[유저 스킬] (11개)
  ✅ check-progress
  ✅ commit-push
  ...

완료!
```

### `oh-my-claude project-init`

Sets up **project-level** permissions for the current git repository:

- Merges `presets/project.json` into `.claude/settings.local.json`
  - Unlocks write/edit/bash operations scoped to this project
- Copies skills from `project-skills/` to `.claude/skills/` (empty by default — add your own)
- Backs up any existing `settings.local.json` before overwriting

```
oh-my-claude project-init

프로젝트: /your/project

[권한]
  ✅ allow: Write(*), Edit(*), Bash(*), NotebookEdit(*)

완료!
```

### `oh-my-claude --help`

Prints usage information.

---

## Customization

Fork this repository and edit the presets and skills to match your workflow.

### Edit permission presets

**`presets/user.json`** — user-level permissions and plugins:
- `permissions.allow` — tools Claude can use without confirmation
- `permissions.deny` — tools always blocked (e.g. `Bash(rm -rf:*)`)
- `enabledPlugins` — plugins to auto-install on next Claude session start
- `extraKnownMarketplaces` — additional plugin marketplaces to register

**`presets/project.json`** — project-level permissions:
- `permissions.allow` — destructive tools unlocked per-project (Write, Edit, Bash, etc.)

### Add or edit user skills

Drop skill directories into `user-skills/`. Each skill needs a `SKILL.md` file:

```
user-skills/
  my-skill/
    SKILL.md        ← skill definition (trigger keywords, instructions)
```

`oh-my-claude init` copies everything from `user-skills/` to `~/.claude/skills/`.

### Add project-specific skills

Drop skill directories into `project-skills/`. They will be copied to `.claude/skills/` when `project-init` runs.

```
project-skills/
  deploy-prod/
    SKILL.md
```

---

## How It Works

The CLI does the actual work. The Claude plugin commands (`/claude-init`, `/project-init`) are thin wrappers that run `npx oh-my-claude <command>` inside a Bash tool call.

```
User types: "클로드초기설정해"
      ↓
Claude triggers: /claude-init (commands/claude-init.md)
      ↓
Claude runs: Bash → npx oh-my-claude init
      ↓
CLI writes: ~/.claude/settings.json + ~/.claude/skills/
```

This means:
- The CLI works standalone (no Claude session needed)
- The plugin commands are ergonomic shortcuts for when you're already in Claude
- Customizations live in this repo, not scattered across your machine

### File layout

```
oh-my-claude/
  bin/cli.js              ← CLI entrypoint
  presets/
    user.json             ← user-level settings preset
    project.json          ← project-level settings preset
  user-skills/            ← skills copied to ~/.claude/skills/ by init
    check-progress/
    commit-push/
    ...
  project-skills/         ← skills copied to .claude/skills/ by project-init
  commands/
    claude-init.md        ← /claude-init plugin command
    project-init.md       ← /project-init plugin command
  skills/
    claude-init.md        ← skill trigger for claude-init
    project-init.md       ← skill trigger for project-init
  plugin.json             ← Claude plugin manifest
```

---

## License

MIT
