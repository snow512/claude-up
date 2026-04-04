---
name: claude-permissions
model: sonnet
description: 프로젝트 기본 권한 설정 — 안전한 개발 작업 허용, 위험 작업 차단, 중간 위험 작업은 확인 후 실행. 트리거: 클로드권한부여해
allowed-tools: Bash, Read, Write, Edit, Glob
---

## 프로젝트 기본 권한 설정

현재 프로젝트의 `.claude/settings.json`에 안전한 기본 권한을 설정합니다.

### 권한 템플릿

`permissions.json` 파일에 allow/deny/ask 규칙이 정의되어 있다.
권한 규칙을 수정하려면 `permissions.json`만 편집하면 된다.

### 실행 순서

1. **프로젝트 루트 확인**: `git rev-parse --show-toplevel`로 프로젝트 루트 탐지
2. **템플릿 읽기**: 이 스킬 디렉토리의 `permissions.json`을 읽는다
3. **기존 설정 백업**: `.claude/settings.json`이 있으면 `.claude/settings.json.bak.{timestamp}`로 백업
4. **기존 설정 읽기**: 기존 설정이 있으면 읽어서 기존 값을 보존
5. **권한 설정 적용**: 기존 설정에 `permissions.json`의 내용을 `permissions` 블록으로 머지하여 `.claude/settings.json`에 저장
6. **.claude 디렉토리가 없으면 생성**: `mkdir -p .claude`

### 설정 적용 방법

1. 프로젝트 루트의 `.claude/settings.json`을 대상으로 한다
2. 기존 설정이 있으면 다른 설정값은 보존하면서 `permissions` 블록만 추가/업데이트
3. 기존 설정이 없으면 새로 생성

### 적용 후 출력

```
Claude Code 프로젝트 권한 설정 완료

설정 파일: {프로젝트루트}/.claude/settings.json
백업 파일: {있으면 경로 표시}

자동 허용 (Allow): {N}개 규칙
  - 빌드, Git, 파일조회, 텍스트처리, Docker 등

차단 (Deny): {N}개 규칙
  - 시스템 파괴, main/master 강제 푸시, 민감파일 읽기

확인 필요 (Ask): {N}개 규칙
  - 파일 삭제, sudo, 서비스 제어, 강제 Git 작업
```

### 주의사항

- 기존 `permissions` 블록이 있으면 덮어쓰기 (백업 있으므로 안전)
- `settings.local.json`은 건드리지 않음
- 이 설정은 프로젝트 레벨이므로 git에 커밋하면 팀 전체에 적용됨
- DENY는 다른 레벨에서 override 불가 (최우선 적용)
