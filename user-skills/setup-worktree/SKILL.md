---
name: setup-worktree
model: haiku
description: 워크트리 설정 가이드 — 포트 체계, 새 워크트리 체크리스트, 실행 명령어, 시드 데이터
allowed-tools: Bash, Read, Glob, Grep
user-invocable: true
---

## 워크트리 & 포트 체계

동일 프로젝트를 여러개의 워크트리로 병렬 개발합니다.
**포트 충돌 방지를 위해 각 워크트리마다 고유 포트 대역을 사용합니다.**

자세한 포트나 관리 정보는 `PROJECT.md`와 각 워크트리의 진행 파일(`docs/worktrees/worktree-{워크트리명}.md`)을 참조한다.

### 관리 규칙
- **워크트리별 독립 관리:** `.claude/` 폴더는 `.gitignore`에 포함되어 각 워크트리에서 독립적으로 관리됨
- **진행 상황은 `docs/worktrees/worktree-{워크트리명}.md`에 기록** (Git 커밋, 공유됨)

### 개발용 포트 규칙
- **FE:** `5X00` / **BE:** `5X01` / **DB:** `5X02` (X = 0, 1, 2)
- 모든 포트는 `.env` 파일로 관리 (`.gitignore`에 포함, 커밋 안됨)
- `docker-compose.yml`와 Vite에 변수화 한다
- **Docker 프로덕션 배포 포트는 워크트리 구분 없이 고정:** FE `5300` / BE `5301` / DB `5302` (`.env.production` 기준)

### 프로덕션 배포 포트 (고정)
- **Docker 프로덕션 배포는 워크트리 구분 없이 항상 5300 대역 사용**
- FE: `5300` / BE: `5301` (디버그 전용) / DB: `5302` (디버그 전용)
- 어떤 워크트리에서 `./deploy.sh`를 실행하든 동일 포트·동일 컨테이너명(`ktm-*-prod`)
- 동시에 여러 배포 불가 — 기존 배포를 `./deploy.sh --down`으로 중지 후 재배포
- 상세: `docs/specs/8-deployment.md`

### 새 워크트리 설정 체크리스트
1. 루트 `.env` — Docker 포트/컨테이너/볼륨/네트워크명
2. `backend/.env` — `DB_PORT`, `PORT`, `CORS_ORIGIN`
3. `frontend/.env` — `VITE_API_URL`
4. `docker compose up -d` → `npm run seed` → 서버 실행

### 실행 명령어
```bash
# 1. PostgreSQL 시작 (포트는 .env의 KTM_DB_EXTERNAL_PORT에 따름)
docker compose up -d

# 2. 데이터베이스 시드 (초기 데이터)
cd backend && npm run seed

# 3. 백엔드 개발 서버 실행 (포트는 backend/.env의 PORT에 따름)
cd backend && npm run start:dev

# 4. 프론트엔드 개발 서버 실행 (포트는 .env의 KTM_CLIENT_PORT에 따름)
cd frontend && npm run dev

# 또는 스크립트 사용
./server.sh   # 백엔드
./client.sh   # 프론트엔드
./deploy.sh   # 배포 (Docker)
```

### 시드 데이터
- 테스트 계정: `test@test.com` / `test1234`
- 관리자 계정: `admin@admin.com` / `test1234`
- 매출 채널: 홀, 배달의민족, 쿠팡이츠, 요기요, 배달특급, 네이버
- 지출 카테고리: 12개 대분류 + 35개 소분류
