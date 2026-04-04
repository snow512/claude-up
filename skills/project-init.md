---
name: project-init
description: 프로젝트 레벨 권한 및 스킬 초기 설정 로직 — settings.local.json에 파괴적 권한 적용
allowed-tools: Bash
user-invocable: false
---

## 프로젝트 초기 설정

`npx oh-my-claude project-init` 명령을 실행하여 프로젝트 레벨 권한을 설정합니다.

### 수행 내용

1. `.claude/settings.local.json`에 Write, Edit, Bash 등 파괴적 권한 적용
2. `.claude/skills/`에 프로젝트 공통 스킬 복사
3. 기존 설정은 자동 백업됨

### 실행

```bash
npx oh-my-claude project-init
```
