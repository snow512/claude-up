---
name: claude-init
description: 유저 레벨 Claude Code 환경 초기 설정 로직 — settings.json 머지, 플러그인 활성화, 유저 스킬 복사
allowed-tools: Bash
user-invocable: false
---

## Claude Code 초기 설정

`npx oh-my-claude init` 명령을 실행하여 유저 레벨 환경을 설정합니다.

### 수행 내용

1. `~/.claude/settings.json`에 permissions, enabledPlugins, marketplaces 적용
2. `~/.claude/skills/`에 유저 스킬 복사
3. 기존 설정은 자동 백업됨

### 실행

```bash
npx oh-my-claude init
```
