# cup security 명령 추가

## Context

claude-up은 현재 권한·플러그인·스킬을 관리하지만, **보안 설정을 통합 관리하는 진입점이 없다**. 사용자별로 어떤 deny 규칙·민감정보 점검 지침이 적용되어 있는지 확인하기 어렵고, "느슨한 개발 환경 vs 엄격한 프로덕션 환경"을 빠르게 전환하는 수단도 없다.

이 작업은:
1. `cup security` 명령 그룹을 신설하여 보안 설정의 관리 진입점을 만든다.
2. 보안 설정을 **3단계 레벨(loose / normal / strict)**로 정의하여, 한 명령으로 통째로 적용할 수 있게 한다.
3. `cup init`에 보안 단계를 자동 통합하여, 새 환경 부트스트랩 시 최소한의 normal 보안이 함께 설치되도록 한다.

normal 레벨은 **현재 사용자의 설정 그대로**(7개 deny 규칙 + 민감정보 커밋 점검 지침)를 기준으로 한다. strict는 그 위에 더 강력한 가드를, loose는 핵심만 남기고 풀어준다.

---

## CLI Surface

```
cup security                  # 도움말 출력 (서브커맨드 목록)
cup security init [--level=loose|normal|strict] [--provider=...] [--yes]
cup security check [--provider=...] [--verbose]
cup security diff [--level=...] [--provider=...]    # (신규 추가)
```

- `--level` 미지정 시 기본값 **normal**
- `cup security` 단독 호출 → 도움말만 출력 (다른 명령 분기와 동일 패턴)
- `cup init`이 내부적으로 `runSecurityInit({ level: 'normal' })`을 마지막 단계 직전에 호출 (자동 통합)

### 추가 명령 제안

**`cup security diff`** — 현재 설치된 보안 설정과 선택한 레벨 사이의 차이를 표 형태로 보여준다. 레벨 변경 전 어떤 deny 규칙이 추가/제거될지 미리 확인 가능.

---

## Security Levels

### Level 정의

| 항목 | loose (헐렁하게) | **normal (기본)** | strict (엄격하게) |
|------|-----------------|-------------------|-------------------|
| **deny rules** | 2개 (rm -rf, force-push만) | 7개 (현재 유저 설정) | 12개 (normal + 추가 5개) |
| **지침 블록** | 없음 | 민감정보 커밋 점검 | normal + 외부 호출/배포 가드 |
| **권한 파일 chmod 검증** | 경고만 | 0600 권장 | 0600 강제 |
| **샌드박스 모드** (Gemini/Codex) | off | warn | enforce |
| **사용 시나리오** | 빠른 실험, 개인 토이 | 일반 개발 | 프로덕션 코드, 팀 협업 |

### normal deny rules (현재 유저 설정 그대로)

```
Bash(rm -rf:*)
Bash(git push --force:*)
Bash(git push -f:*)
Bash(git reset --hard:*)
Bash(git clean -f:*)
Bash(git checkout -- .:*)
Bash(git branch -D:*)
```

### strict 추가 deny rules

```
Bash(chmod 777:*)
Bash(curl * | bash:*)
Bash(curl * | sh:*)
Bash(wget * | bash:*)
Bash(eval:*)
```

### loose deny rules (normal에서 축소)

```
Bash(rm -rf /:*)              # 시스템 루트만
Bash(git push --force:*)
Bash(git push -f:*)
```

### 지침 블록 (cup-security 블록, cup 블록과 별도)

normal:
```markdown
<!-- <cup-security> — managed by claude-up -->

## Security Rules (normal)

### 민감정보 커밋 점검
- 커밋 전 스테이징에 민감정보가 있는지 확인
- 주의 파일: .env, .npmrc, credentials.json, *.pem, *.key
- 코드 내 하드코딩 금지: API 키, 토큰(ghp_, npm_, sk-), 비밀번호

<!-- </cup-security> -->
```

strict:
```markdown
<!-- <cup-security> — managed by claude-up -->

## Security Rules (strict)

### 민감정보 커밋 점검
(normal 내용 동일)

### 외부 호출 가드
- 외부 API 호출 시 환경변수 사용 의무
- curl/wget을 bash로 파이프하지 않음
- 네트워크 요청은 명시적으로 사용자에게 알린 후 실행

### 배포 가드
- 프로덕션 배포는 사용자 명시적 지시에만 (qa/main 머지, --prod 배포 금지)
- 마이그레이션은 백업 후 단계별 진행

<!-- </cup-security> -->
```

loose: 블록 자체를 설치하지 않음

---

## File Structure

```
presets/
└── security/
    ├── loose.json          # { permissions: { deny: [...] } } per provider keys
    ├── normal.json         # 현재 claude.json deny와 동일
    ├── strict.json         # normal + 추가 패턴
    ├── claude-md.md        # cup-security 블록 (Claude/공통)
    └── strict-md.md        # strict 전용 추가 블록
```

각 레벨 JSON은 프로바이더별로 분기:
```json
{
  "level": "normal",
  "providers": {
    "claude": { "deny": ["Bash(rm -rf:*)", ...] },
    "gemini": { "policies": [{ "toolName": "shell", "argsPattern": "...", ... }] },
    "codex":  { "sandbox_mode": "workspace-write" }
  }
}
```

---

## Implementation

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/security.ts` | `runSecurity`, `runSecurityInit`, `runSecurityCheck`, `runSecurityDiff` 핸들러 |
| `presets/security/loose.json` | loose 레벨 정의 |
| `presets/security/normal.json` | normal 레벨 정의 |
| `presets/security/strict.json` | strict 레벨 정의 |
| `presets/security/normal-md.md` | normal/strict 공통 cup-security 블록 |
| `presets/security/strict-md.md` | strict 전용 추가 블록 |

### 수정 파일

| 파일 | 변경 |
|------|------|
| `src/cli.ts` | `level` 옵션 추가, `case 'security'` 라우팅 |
| `src/installer.ts` | `Opts` 인터페이스에 `level` 추가, `runInit`에 보안 설치 단계 통합 |
| `src/providers/types.ts` | `getCurrentDenyRules()` 같은 헬퍼 추가 (이미 `getCurrentPermissions`로 충분, 신규 필요 없음) |
| `presets/claude-md.md`/`gemini-md.md`/`agents-md.md` | 변경 없음 (security 블록은 별도 마커로 분리) |
| `CLAUDE.md` (프로젝트) | CLI Commands 섹션에 `cup security` 추가 |
| `docs/architecture.md` | 보안 레벨 시스템 설명 추가 |
| `docs/setup.md` | `cup security init --level=...` 사용법 추가 |

### 코드 흐름

**`cup security` (도움말):**
```typescript
function showSecurityHelp(): void {
  // Banner + 서브커맨드 목록 + 레벨 설명
}
```

**`cup security init`:**
```typescript
async function runSecurityInit(opts: Opts): Promise<void> {
  const level = (opts.level || 'normal') as 'loose' | 'normal' | 'strict';
  const preset = readJson(`presets/security/${level}.json`);
  const providers = resolveProviders(opts.provider);

  for (const provider of providers) {
    // 1. 백업
    provider.backupSettings();

    // 2. 프로바이더별 deny 적용 (mergeSecurityDeny)
    applySecurityDeny(provider, preset.providers[provider.name]);

    // 3. cup-security 지침 블록 쓰기 (loose는 스킵)
    if (level !== 'loose') {
      const block = readSecurityBlock(level, provider.instructionFileName);
      writeSecurityBlock(provider, block);  // <!-- <cup-security> --> 마커
    }

    // 4. 권한 파일 chmod 검증/수정
    enforceFilePerms(provider, level);
  }

  console.log(`✓ Security level: ${level} applied`);
}
```

**`cup security check`:**
```typescript
function runSecurityCheck(opts: Opts): void {
  const providers = resolveProviders(opts.provider);

  for (const provider of providers) {
    // 1. 현재 deny 규칙 개수 + 권장 레벨과 비교
    const current = provider.getCurrentPermissions();

    // 2. 시크릿 파일 권한 (~/.claude/.cup-auth, ~/.npmrc) 0600 확인
    // 3. 홈 디렉토리 백업 파일 내 시크릿 패턴 스캔 (옵션)
    // 4. 현재 git 저장소에 .env 추적 여부
    // 5. cup-security 블록 설치 여부

    // 결과: ✓ 안전 / ! 권장 / ✗ 위험
  }
}
```

**`cup security diff`:**
```typescript
function runSecurityDiff(opts: Opts): void {
  const targetLevel = (opts.level || 'normal');
  // 현재 설정과 target preset 비교 → +/- 형태로 출력
}
```

**`cup init` 통합:**
- `runInit`의 마지막 step으로 `Security (level: normal)` 추가
- `--level` 플래그가 있으면 그 레벨, 없으면 normal
- 별도 step으로 추가하면 `renderStep(N+1, total+1, 'Security')`로 표시

### Provider별 deny 적용 로직

`src/security.ts`의 헬퍼:

```typescript
function applySecurityDeny(provider: Provider, levelConfig: Record<string, unknown>): void {
  const settings = provider.readSettings() || {};

  if (provider.name === 'claude') {
    const denyList = (levelConfig.deny as string[]) || [];
    const perms = (settings.permissions as Record<string, unknown>) || {};
    perms.deny = denyList;
    settings.permissions = perms;
    provider.writeSettings(settings);
  } else if (provider.name === 'gemini') {
    // policies TOML 재생성 (이미 GeminiProvider에 writePolicies 메서드 있음 → 노출 필요)
    // 또는 GeminiProvider에 setSecurityPolicies(rules) 메서드 추가
  } else if (provider.name === 'codex') {
    // sandbox_mode 키 갱신
    settings.sandbox_mode = levelConfig.sandbox_mode;
    provider.writeSettings(settings);
  }
}
```

**대안**: `Provider` 인터페이스에 `applySecurityLevel(levelConfig)` 메서드를 추가하고 각 프로바이더가 자체 구현 → 더 깔끔하지만 인터페이스 확장 필요. **이 방향을 권장**.

---

## Verification

### 빌드 + 테스트
```bash
npm run build
npm test
```

### 수동 검증

```bash
# 1. 도움말
node bin/cli.js security
# 기대: 서브커맨드 목록 출력

# 2. normal 레벨 적용 (Claude만)
node bin/cli.js security init --provider=claude --yes
# 기대: ~/.claude/settings.json에 deny 7개, ~/.claude/CLAUDE.md에 <cup-security> 블록

# 3. check
node bin/cli.js security check --provider=claude
# 기대: ✓ 7 deny rules / ✓ cup-security block installed / ✓ .cup-auth 0600

# 4. strict 레벨로 업그레이드
node bin/cli.js security init --provider=claude --level=strict --yes
# 기대: deny 12개로 확장, cup-security 블록에 외부호출/배포 가드 추가

# 5. diff
node bin/cli.js security diff --provider=claude --level=loose
# 기대: 현재(strict) vs loose 차이 표 출력 (+ 제거될 규칙들)

# 6. init 통합 검증
node bin/cli.js init --provider=claude --yes
# 기대: 기존 step + Security step (normal) 자동 추가됨

# 7. 멀티 프로바이더
node bin/cli.js security init --yes
# 기대: 설치된 모든 프로바이더(Claude/Gemini/Codex)에 normal 적용
```

### 회귀 검증
- 기존 `cup init`, `cup doctor`, `cup status` 동작 변화 없는지 확인
- 테스트 51개 모두 통과
- 백업 파일이 정상 생성되는지

---

## Risks

| 리스크 | 대응 |
|--------|------|
| `cup-security` 블록과 기존 `cup` 블록 간 충돌 | 서로 다른 마커 사용 (`<!-- <cup-security> -->`) + base.ts에 별도 헬퍼 |
| Gemini policies TOML 재생성 시 사용자 수동 추가 규칙 손실 | cup-deny.toml만 덮어쓰고 다른 .toml은 건드리지 않음 (기존 동작 유지) |
| Codex의 sandbox_mode 변경이 사용자 워크플로우 깨뜨림 | strict에서만 enforce, normal/loose는 warn or skip |
| `cup init`에 보안 단계 자동 추가 → 기존 사용자 init 결과 변화 | normal은 현재 동작과 동일하므로 사실상 무변화 |
| Provider 인터페이스 변경 (applySecurityLevel) → 외부 코드 영향 | 외부 사용처 없음 (npm 패키지 내부 구조), 안전 |

---

## Out of Scope

- pre-commit hook 자동 설치 (사용자 git 환경 침범 우려)
- 네트워크 보안 (방화벽, VPN 등)
- LLM 응답 보안 (프롬프트 인젝션 방어 등) — 이건 LLM 도구 자체의 영역
- `cup security fix` (자동 수정) — Phase 2에서 추가 검토
