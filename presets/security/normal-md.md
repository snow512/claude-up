
<!-- <cup-security> — managed by claude-up, do not edit manually -->

## Security Rules (normal)

### 민감정보 커밋 점검
- 커밋/푸시 전에 반드시 스테이징 대상에 민감정보(실제 값)가 포함되었는지 확인
- 주의 파일: `.env`, `.npmrc`, `credentials.json`, `*.pem`, `*.key` — 실제 비밀값이 들어있으면 커밋 금지 (빈 템플릿/예시값은 OK)
- 코드 내 하드코딩 금지: API 키, 토큰(`ghp_`, `npm_`, `sk-` 등), 비밀번호, 개인정보
- 의심되면 커밋 중단하고 사용자에게 경고

<!-- </cup-security> -->
