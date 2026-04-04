---
name: merge-develop
model: haiku
description: 현재 브랜치를 develop에 머지하고 브랜치 삭제 (디벨롭에 머지해)
allowed-tools: Bash, Read
---

## develop 머지

현재 브랜치의 모든 변경사항을 develop에 머지하고, 브랜치를 삭제합니다.

### 실행 순서

1. **미커밋 확인**: `git status`로 미커밋 변경 확인
   - 변경사항이 있으면 커밋 + 푸시 먼저 수행
2. **현재 브랜치 기록**: 머지 후 삭제할 브랜치명 저장
3. 관련 타스크 및 워크트리 진행상태 업데이트 먼저 수행
4. **develop 체크아웃**: `git checkout develop && git pull origin develop`
5. **머지**: `git merge <브랜치명> --no-edit`
   - 충돌 발생 시 사용자에게 보고하고 중단
6. **develop 푸시**: `git push origin develop`
7. **브랜치 삭제**: 로컬 + 리모트 삭제
   - `git branch -d <브랜치명>`
   - `git push origin --delete <브랜치명>`

### 주의사항

- `main` 또는 `develop` 브랜치에서는 실행하지 않는다 (머지 대상이 없음)
- 충돌 발생 시 자동 해결하지 않고 사용자에게 보고한다
- 머지 후 `docs/worktrees/progress-{현재워크트리}.md` 업데이트는 별도 지시 시에만 수행
