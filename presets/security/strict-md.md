
<!-- <cup-security> — managed by claude-up, do not edit manually -->

## Security Rules (strict)

### 민감정보 커밋 점검
- 커밋/푸시 전에 반드시 스테이징 대상에 민감정보(실제 값)가 포함되었는지 확인
- 주의 파일: `.env`, `.npmrc`, `credentials.json`, `*.pem`, `*.key` — 실제 비밀값이 들어있으면 커밋 금지
- 코드 내 하드코딩 금지: API 키, 토큰(`ghp_`, `npm_`, `sk-` 등), 비밀번호, 개인정보
- 의심되면 커밋 중단하고 사용자에게 경고

### 외부 호출 가드
- 외부 API 호출 시 환경변수 사용 의무 (코드 내 하드코딩 금지)
- `curl`/`wget`을 `bash`/`sh`로 파이프하지 않음 (원격 실행 차단)
- 네트워크 요청은 명시적으로 사용자에게 알린 후 실행
- 새 외부 서비스 연동 시 사용자 승인 필수

### 배포 가드
- 프로덕션 배포는 사용자 명시적 지시에만 (qa/main 머지, `--prod` 배포 금지)
- 마이그레이션은 백업 후 단계별 진행
- `chmod 777`, `eval`, 임의 코드 실행 금지

<!-- </cup-security> -->
