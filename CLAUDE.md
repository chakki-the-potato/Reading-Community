# Project Rules

## Screenshots / 페이지 캡쳐
- 모든 페이지 캡쳐는 `screenshots/` 디렉토리에 저장한다. 프로젝트 루트나 다른 곳에 두지 말 것.
- `mcp__playwright__browser_take_screenshot` 호출 시 `filename` 파라미터를 반드시 `screenshots/<descriptive-name>.png` 형태로 명시.
- 파일명 규칙: `<목적>-<뷰포트>.png` (예: `redesign-desktop-1440.png`, `v3-mobile-420.png`).
- `screenshots/` 폴더는 git 추적 대상이 아니다 (`.gitignore`에 등재됨). 검증용 임시 산출물이며 커밋하지 않는다.
