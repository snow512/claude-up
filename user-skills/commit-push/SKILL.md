---
name: commit-push
model: sonnet
description: 현재 변경사항을 커밋하고 푸시 (커밋 푸쉬해, 커푸). "커밋해" 또는 "커밋만해"로 호출하면 커밋만 수행(푸시 없음). 커밋 전에 ESLint 검증과 코드 정리를 자동 수행하여 깨끗한 코드만 커밋합니다.
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

## 커밋 & 푸시

현재 작업된 변경사항을 커밋하고 푸시합니다.
커밋 전에 변경된 파일의 코드 품질을 검증하고, 문제가 있으면 자동 수정합니다.

### 모드

- **커밋+푸시** (기본): "커푸", "커밋 푸쉬해" → 커밋 후 푸시까지 수행
- **커밋만**: "커밋해", "커밋만해" → 커밋만 수행, 푸시하지 않음

### 실행 순서

1. **상태 확인**: `git status`, `git diff --stat`, `git log --oneline -5` 병렬 실행
2. **변경사항 없으면**: "이미 커밋·푸시 완료된 상태입니다" 출력 후 종료
3. **코드 품질 검증** (프론트엔드 변경이 있을 때):
   - 변경된 `.ts`, `.tsx` 파일 목록 추출
   - `npx eslint <파일목록>` 실행
   - **error가 있으면**: `npx eslint --fix`로 자동 수정 시도 → 재검증
   - 자동 수정 불가한 error가 남으면: 사용자에게 보고하고 **커밋 중단**
   - warning만 있으면: `npx eslint --fix`로 자동 수정 후 진행
   - 0 errors, 0 warnings이면: 그대로 진행
4. **관련 타스크 업데이트** (커밋 전에 먼저 수행):
   - `docs/tasks/`에서 현재 작업과 관련된 타스크를 찾아 진행 내용을 반영
   - 관련 타스크가 없으면 건너뜀
   - 타스크 파일 변경분도 이후 커밋에 함께 포함
5. **커밋**: 변경 내용을 분석하여 한국어 커밋 메시지 작성
   - `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` 포함
   - HEREDOC 형식으로 커밋 메시지 전달
6. **푸시** (커밋+푸시 모드일 때만): `git push`
   - "커밋해", "커밋만해"로 호출된 경우 이 단계를 건너뛴다

### ESLint 검증 상세

프론트엔드(`frontend/src/**/*.{ts,tsx}`)와 백엔드(`backend/src/**/*.ts`) 각각 검증합니다.
해당 영역에 변경 파일이 없으면 그 영역은 건너뜁니다.

```bash
# 변경 파일 추출 (staged + unstaged)
FRONTEND_FILES=$(git diff --name-only HEAD | grep -E 'frontend/src/.*\.(ts|tsx)$')
BACKEND_FILES=$(git diff --name-only HEAD | grep -E 'backend/src/.*\.ts$')

# 프론트엔드 검증
if [ -n "$FRONTEND_FILES" ]; then
  cd frontend && npx eslint $FRONTEND_FILES
fi

# 백엔드 검증
if [ -n "$BACKEND_FILES" ]; then
  cd backend && npx eslint $BACKEND_FILES
fi

# 자동 수정 (warning이나 fixable error가 있을 때)
npx eslint --fix <파일목록>
```

error가 남아있으면 커밋하지 않습니다. 사용자에게 에러 내용을 보여주고 수동 수정을 요청합니다.

### 커밋 메시지 규칙

- prefix: `fix:`, `feat:`, `refactor:`, `docs:`, `chore:` 등
- 한국어로 간결하게 변경 요약 (1~2줄)
- 여러 파일 변경 시 주요 변경 건수를 명시 (예: "보강 5건")

### 주의사항

- `.env`, credentials 등 민감 파일은 커밋하지 않는다
- `git add`는 변경된 파일만 명시적으로 추가 (`git add -A` 사용 금지)
- ESLint --fix가 파일을 수정하면 해당 파일도 커밋에 포함
- 타스크 업데이트 파일도 함께 커밋에 포함
