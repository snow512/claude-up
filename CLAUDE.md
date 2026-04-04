# oh-my-claude

Claude Code environment bootstrap + management tool. npm CLI + Claude plugin hybrid.

## Project Structure

```
oh-my-claude/
├── bin/
│   ├── cli.js              # CLI entry point (command routing)
│   ├── ui.js               # UI rendering (colors, banner, checkbox, spinner)
│   └── installer.js        # init/project-init/clone/backup/restore/status/doctor/update logic
├── package.json            # npm package (bin: oh-my-claude, omc)
├── plugin.json             # Claude plugin manifest
├── statusline-command.sh   # Custom status bar script
├── presets/
│   ├── user.json           # User-level settings (permissions, plugins, marketplaces)
│   └── project.json        # Project-level settings (destructive permissions)
├── user-skills/            # Skills copied to ~/.claude/skills/
│   ├── */SKILL.md          # English (default)
│   └── */SKILL.ko.md       # Korean
├── project-skills/         # Skills copied to .claude/skills/
├── commands/               # Claude plugin commands (CLI wrappers)
└── skills/                 # Claude plugin skills
```

## Key Rules

- **bin/*.js**: Zero dependencies. Node.js built-in modules only (fs, path, readline, child_process)
- **CLI output**: English
- **When modifying user-skills**: Update both the repo and `~/.claude/skills/`
- **Preset merge strategy**: Overwrite only preset keys; preserve other existing keys (statusLine, etc.)
- **Skill overwrite policy**: Repo is source of truth → overwrite. Local-only skills are not deleted
- **Backup required**: Always create `.bak.{timestamp}` before modifying settings files
- **i18n**: Skills support en/ko. SKILL.md = English (default), SKILL.ko.md = Korean

## CLI Commands

```bash
omc init              # Interactive environment setup (permissions, plugins, skills, statusline)
omc project-init      # Set up project-level permissions & skills
omc update            # Update only changed skills from repo
omc status            # Show current environment summary
omc doctor            # Diagnose configuration issues
omc clone             # Export current ~/.claude/ as portable package
omc backup            # Snapshot ~/.claude/ to a .tar.gz
omc restore <file>    # Restore from backup or clone folder
```

Alias: `oh-my-claude` = `omc`

## User Skills (13)

| Skill | Trigger | Purpose |
|-------|---------|---------|
| branch-sync | sync, pull from | Bidirectional/unidirectional branch sync |
| clean-code | clean code | Project detection → lint → analyze → fix → /simplify |
| clean-ui | clean ui | UI code quality (a11y, design tokens, component patterns) |
| commit-push | commit, push | Lint → update docs → commit → push |
| doc-structure | document, update docs | Generate docs from source / update docs from changes |
| enhance | harden, improve, unify UI | Active code hardening + UX improvement + UI consistency |
| merge-branch | merge, create PR | Direct merge to develop / PR for main·qa |
| project-sync | pull, sync project | git pull + commit briefing + deps install + doc summary |
| ralph-loop-run | ralph loop | Auto-determine iterations & completion condition |
| restart-server | restart server, stop | Auto-detect project type → restart/stop server |
| security-audit | security audit | Secret scan + .env check + Claude permission audit + dep security |
| setup-workspace | setup workspace | Hard-clone parallel workspaces (auto port assignment) |
| version-release | bump version, changelog | SemVer version management + CHANGELOG.md generation |

## Skill Settings Storage

When a skill needs to remember per-project settings, store in `.claude/settings.local.json`:
```json
{
  "permissions": { ... },
  "skills": {
    "clean-code": { "linterDeclined": true },
    "commit-push": { "linterDeclined": true }
  }
}
```

## Commit Rules

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- Include `Co-Authored-By: Claude <noreply@anthropic.com>`
- Commit message language: Follow existing project log (this project uses Korean + English mix)

## GitHub

- Repository: https://github.com/snow512/oh-my-claude
- npm publish planned (not yet registered)
