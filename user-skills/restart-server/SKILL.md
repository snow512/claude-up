---
name: restart-server
model: haiku
description: 개발 서버 재기동 (서버재기동해). 프로젝트 유형을 자동 감지하여 적절한 방식으로 재시작.
argument-hint: "[환경명] (멀티 워크스페이스인 경우)"
allowed-tools: Bash, Read, Glob, Grep, AskUserQuestion
---

## 서버 재기동

현재 프로젝트의 개발 서버를 재기동합니다. 프로젝트 유형을 자동 감지하여 적절한 방식으로 처리합니다.

### 1단계: 프로젝트 유형 감지

아래 순서로 프로젝트 루트를 탐색하여 유형을 판별합니다.

#### 감지 항목

| 확인 대상 | 판별 결과 |
|-----------|----------|
| `server.sh` + `client.sh` 존재 | 스크립트 기반 풀스택 |
| `backend/` + `frontend/` 디렉토리 | 풀스택 (분리형) |
| `server/` + `client/` 디렉토리 | 풀스택 (분리형, 대체 구조) |
| `src/` + `client/` 디렉토리 | 풀스택 (NestJS + React 등) |
| `frontend/` 또는 `client/` 만 존재 | 프론트엔드 전용 |
| `backend/` 또는 `server/` 또는 `src/` 만 존재 | 백엔드 전용 |
| 루트에 `server.js` 또는 `app.js` 또는 `index.js` | 단일 서버 |
| `bin/` + `package.json`의 `"bin"` 필드 | CLI 프로젝트 |

#### 포트 감지

다음 위치에서 포트 정보를 찾습니다:
- `.env`, `backend/.env`, `server/.env`, `frontend/.env`, `client/.env`
- `package.json`의 scripts 내 `--port` 플래그
- `docker-compose.yml`의 ports 매핑
- `vite.config.*`의 server.port 설정

#### 멀티 워크스페이스 감지

`stop.sh`가 인자를 받는 구조이면 멀티 워크스페이스로 판단합니다.
`$ARGUMENTS`가 있으면 환경명으로 사용하고, 없으면 `.env`의 PORT 값으로 환경을 추론합니다.

### 2단계: 기존 프로세스 중지

우선순위 순서로 시도합니다:

1. **`stop.sh` 존재** → `./stop.sh [환경명]` 실행
2. **stop.sh 없음** → 감지된 포트를 사용하는 프로세스를 직접 종료
   ```bash
   # 포트 사용 프로세스 확인 후 종료
   ss -tlnp | grep :<PORT>
   kill <PID>  # graceful 먼저, 실패 시 kill -9
   ```

### 3단계: 서버 시작

프로젝트 유형에 따라 분기합니다.

#### A. 스크립트 기반 (`server.sh` / `client.sh` 존재)

1. `./server.sh [환경명]` 백그라운드 실행
2. 5초 대기 후 백엔드 포트 LISTEN 확인
3. `./client.sh [환경명]` 백그라운드 실행
4. 5초 대기 후 프론트엔드 포트 LISTEN 확인

#### B. package.json 기반 (스크립트 없음)

`package.json`의 scripts를 읽고 적절한 dev 명령을 실행합니다.

**풀스택 (concurrently 등으로 통합)**:
- 루트 `package.json`에 `dev` 스크립트가 서버+클라이언트를 동시에 실행하는 경우
- `npm run dev` 백그라운드 실행

**풀스택 (분리형)**:
- 백엔드 디렉토리에서 `npm run start:dev` 또는 `npm run dev` 백그라운드 실행
- 5초 대기
- 프론트엔드 디렉토리에서 `npm run dev` 백그라운드 실행

**프론트엔드 전용**:
- `npm run dev` 백그라운드 실행

**백엔드 전용**:
- `npm run start:dev` 또는 `npm run dev` 백그라운드 실행

**단일 서버**:
- `npm start` 또는 `node server.js` 백그라운드 실행

#### C. Docker 기반

- `docker-compose.yml` 존재 시 `docker compose up -d` 실행
- Docker + 로컬 서버 조합인 경우 Docker 먼저 올린 후 서버 시작

### 4단계: 구동 확인

감지된 모든 포트가 LISTEN 상태인지 확인합니다.

```bash
ss -tlnp | grep :<PORT>
```

결과를 요약 보고합니다:
```
서버 재기동 완료!
- 백엔드: 포트 XXXX ✓
- 프론트엔드: 포트 XXXX ✓
```

### 5단계: 스크립트 미존재 시 생성 제안

`server.sh`, `client.sh`, `stop.sh`가 없는 풀스택 프로젝트인 경우:

1. 재기동 완료 후 사용자에게 질문합니다:
   > "이 프로젝트에 `server.sh`, `client.sh`, `stop.sh` 스크립트가 없습니다. 다음 재기동을 위해 자동 생성할까요?"
2. 사용자가 동의하면 프로젝트 구조에 맞는 스크립트를 생성합니다.
3. 생성된 스크립트에 실행 권한을 부여합니다 (`chmod +x`).

생성 시 반영할 내용:
- 감지된 포트 번호
- 백엔드/프론트엔드 디렉토리 경로
- Docker 사용 여부
- PID 파일 관리 (`server.pid`, `client.pid`)

### 주의사항

- Docker(DB 등)가 필요한 프로젝트는 `docker compose up -d`를 먼저 실행합니다
- 포트 충돌 시 graceful kill → force kill 순서로 처리합니다
- CLI 전용 프로젝트(`bin/` 구조)는 서버가 없으므로 재기동 대상이 아닙니다. 안내 메시지만 출력합니다.
