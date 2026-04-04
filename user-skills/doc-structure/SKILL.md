---
name: doc-structure
model: haiku
description: >
  문서 폴더 구조 및 관리 규칙 상세 참조.
  트리거: docs 폴더 구조, 파일명 규칙, 문서 관리 방법, 이슈 관리, 타스크 관리, 매뉴얼 관리, 워크트리 진행 관리
allowed-tools: Read, Glob, Grep
user-invocable: false
---

## 문서 폴더 구조 및 관리 규칙

모든 문서는 `/docs` 폴더 아래에서 통합 관리됩니다.
각 폴더에 폴더명과 동일한 파일로 폴더의 규칙을 관리합니다.

```
docs/
├── specs/                   # 설계 문서
│   ├── 1-overview.md
│   ├── 2-tech-stack.md
│   ├── 3-requirements.md
│   ├── 4-architecture.md
│   ├── 5-database.md
│   ├── 5-1-database-seed.md
│   ├── 6-api-design.md
│   └── 7-development-plan.md
├── ui/
│   ├── ui.md                # UI관리 지침
│   └── wireframe-login.md
├── issues/                  # 이슈 추적
│   ├── issues.md            # 이슈관리 규칙
│   ├── issue-{YYYY-MM-DD}-{요약}.md
│   └── .resolved/           # 해결된 이슈 아카이브 월별로 보관
├── worktrees/               # 워크트리 관리
│   ├── .archive             # 워크트리 진행사항 보관
│   ├── worktrees.md         # 워크트리 관리 규칙
│   ├── worktree-main.md     # 메인 워크트리 진행 상황
│   ├── worktree-second.md   # 두번째 워크트리 진행 상황
│   └── worktree-third.md    # 세번째 워크트리 진행 상황
├── manuals/                 # 사용자 매뉴얼
│   ├── manuals.md           # 매뉴얼 관리 지침
│   ├── user-manual.md       # 점주용 매뉴얼
│   ├── alba-manual.md       # 직원용 매뉴얼
│   ├── admin-manual.md      # 관리자용 매뉴얼
│   └── assets/              # 향후 스크린샷/이미지
├── decisions.md             # 핵심 기술 결정사항
└── tasks/                   # 작업 관리
    ├── tasks.md             # 작업 관리 규칙
    ├── todos.md             # 기능 개선 TODO 목록
    ├── future.md            # 향후 확장 계획
    ├── task-{YYYY-MM-DD}-{요약}.md       # 개별 작업
    └── .completed/          # 완료된 작업 아카이브 월별로 보관
```

### `/docs/specs` - 설계 문서
**용도:** 프로젝트의 요구사항, 아키텍처, 설계 등 고정 개발 문서

**관리 규칙:**
- 파일명: `{번호}-{주제}.md` (예: `1-overview.md`)
- 내용: 프로젝트 설계, 요구사항, API 설계 등 참고 자료
- 수정: 설계 변경 시만 수정 (변경 이력 기록)

### `/docs/issues` - 이슈 현황
**용도:** 발견된 버그, 개선사항, 문제 사항 기록

**관리 규칙:**
- 파일명: `{YYYY-MM-DD}-{요약}.md`
- **해결된 이슈:** `/docs/issues/.resolved/` 폴더로 이동
- **미해결 이슈:** `/docs/issues/` 루트에 유지

### `/docs/decisions.md` - 결정사항
**용도:** 프로젝트의 핵심 기술 선택 및 아키텍처 결정사항 기록

**관리 규칙:**
- 꼭 기억해야 할 확정된 결정사항만 보관
- 불필요한 이력이나 진행 상태 구분 없이 단일 파일로 관리
- 새로운 결정사항은 해당 섹션에 추가

### `/docs/worktrees/` - 워크트리별 진행 현황
**용도:** 각 워크트리에서 진행 중인 작업의 상세 기록 (Git 커밋, 모든 워크트리에서 공유)

**관리 규칙:**
- `worktrees.md` — 관리 규칙
- `worktree-main.md` / `worktree-second.md` / `worktree-third.md` — 각 워크트리 진행 상황
- **각 워크트리는 자신의 progress 파일만 수정한다**
- 작업 시작/완료 등 진행 상태가 변경될 때마다 먼저 업데이트하고 작업을 수행
- 브랜치 전환/생성/머지 시 업데이트

### `/docs/manuals/` - 사용자 매뉴얼
**용도:** 역할별 사용자 매뉴얼 관리

**관리 규칙:**
- 관리 지침: `docs/manuals/manuals.md` 참조
- 파일명: `{대상}-manual.md` (예: `user-manual.md`, `alba-manual.md`)
- 신규 작성 시: `/cs-make-manual` 커맨드 활용
- 기능 변경 시: 관련 매뉴얼도 함께 업데이트

### `/docs/tasks/` - 작업 관리
**용도:** 앞으로 진행할 작업 목록 관리

**관리 규칙:**
- `task-{YYYY-MM-DD}-{요약}.md` 파일로 개별 관리
- 완료 시: `.completed/` 폴더로 이동
- 우선순위: `🔴 높음` `🟡 중간` `🟢 낮음`

### 디렉토리 네비게이션
```
keep-the-money/
├── backend/              → NestJS 백엔드 소스
├── frontend/             → React 프론트엔드 소스
├── docs/                 → 모든 문서 통합
│   ├── specs/            → 설계 문서
│   ├── ui/               → UI 관리 지침
│   ├── issues/           → 이슈 추적
│   ├── worktrees/        → 워크트리별 진행 현황
│   ├── tasks/            → 작업 관리
│   └── decisions.md      → 핵심 기술 결정사항
├── CLAUDE.md             → 프로젝트 진입점
├── docker-compose.yml    → 개발 환경 설정
└── deploy.sh             → 배포 스크립트
```
