---
name: merge-develop
description: >
  현재 브랜치를 대상 브랜치에 머지하고 삭제. 대상 브랜치를 자동 감지하거나 인자로 지정 가능.
  트리거: 머지해, 디벨롭에 머지해, 메인에 머지해, merge to develop, merge to main
allowed-tools: Bash, Read
---

## 브랜치 머지

현재 브랜치를 대상 브랜치에 머지하고 삭제한다.

### 대상 브랜치 결정

1. 사용자가 명시하면 그대로 사용 ("메인에 머지해" → `main`, "디벨롭에 머지해" → `develop`)
2. 명시하지 않으면 자동 감지:
   ```bash
   # develop이 있으면 develop, 없으면 main
   git branch -a | grep -qE '(develop|dev)$' && echo develop || echo main
   ```

---

### 실행 순서

1. **안전 검사**:
   - 현재 브랜치가 대상 브랜치와 같으면 → "이미 대상 브랜치에 있습니다" 출력 후 종료
   - `git status`로 미커밋 변경 확인 → 있으면 `/commit-push` 호출

2. **현재 브랜치 기록**: 머지 후 삭제할 브랜치명 저장

3. **대상 브랜치 최신화**:
   ```bash
   git checkout <대상>
   git pull origin <대상>
   ```

4. **머지**:
   ```bash
   git merge <브랜치명> --no-edit
   ```
   충돌 발생 시 → 사용자에게 보고하고 중단 (`git merge --abort` 안내)

5. **푸시**:
   ```bash
   git push origin <대상>
   ```

6. **브랜치 삭제** (로컬 + 리모트):
   ```bash
   git branch -d <브랜치명>
   git push origin --delete <브랜치명>
   ```

7. **결과 보고**:
   ```
   ✅ <브랜치명> → <대상> 머지 완료
   - 로컬 브랜치 삭제됨
   - 리모트 브랜치 삭제됨
   ```

---

### 주의사항

- 충돌 발생 시 자동 해결하지 않고 사용자에게 보고
- protected branch (main/master)로의 머지는 한 번 더 확인
- force push는 하지 않는다
