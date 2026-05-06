# Logo Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SVG 로고 파일들을 네비바·소개 섹션·푸터·CTA 4곳에 배치해 브랜딩 일관성을 높인다.

**Architecture:** 순수 HTML/CSS 변경. JS 없음. 각 위치마다 기존 CSS 전용 요소(`<span class="book-mark">`, `<span class="badge">`, `<svg class="about-star">`)를 `<img>` 태그로 교체하거나 장식 이미지를 추가한다.

**Tech Stack:** HTML, CSS (vanilla)

---

## File Map

| 파일 | 변경 유형 |
|---|---|
| `index.html` | 4곳 HTML 수정 |
| `static/css/style.css` | 기존 CSS 제거/수정 + 신규 클래스 추가 |

---

## Task 1: 네비바 로고 교체

**Files:**
- Modify: `index.html:18-21`
- Modify: `static/css/style.css:192-207`

- [ ] **Step 1: HTML 변경 — 북마크 스팬+텍스트를 img로 교체**

`index.html` line 18–21의 `.nav-logo` 내부를 교체:

```html
<!-- 변경 전 -->
<a href="#top" class="nav-logo">
  <span class="book-mark" aria-hidden="true"></span>
  <span>책책책</span>
</a>

<!-- 변경 후 -->
<a href="#top" class="nav-logo">
  <img src="logo_image/chaek-horizontal-dark.svg" alt="책책책" class="nav-logo-img">
</a>
```

- [ ] **Step 2: CSS — `.nav-logo` 정리 및 `.nav-logo-img` 추가**

`static/css/style.css` line 192–207을 아래로 교체:

```css
/* 변경 전 (line 192–207 전체) */
.nav-logo {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--serif); font-size: 22px; font-weight: 700;
  color: var(--yellow); text-decoration: none;
}
.nav-logo .book-mark {
  display: inline-block; width: 22px; height: 24px;
  background: var(--yellow); position: relative;
  animation: jiggle 2.4s ease-in-out infinite;
  transform-origin: center;
}
.nav-logo .book-mark::before {
  content: ''; position: absolute;
  left: 3px; top: 2px; bottom: 2px; width: 2px;
  background: var(--ink);
}

/* 변경 후 */
.nav-logo {
  display: inline-flex; align-items: center;
  text-decoration: none;
}
.nav-logo-img {
  height: 28px;
  width: auto;
  display: block;
}
```

- [ ] **Step 3: 브라우저 확인**

`index.html` 파일을 브라우저에서 열고:
- 네비바 왼쪽에 가로형 로고 이미지가 표시되는지 확인
- 클릭 시 `#top` 스크롤 이동하는지 확인
- 모바일 폭(375px)에서 잘리지 않는지 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html static/css/style.css
git commit -m "feat(ui): 네비바 로고를 chaek-horizontal-dark.svg 이미지로 교체"
```

---

## Task 2: 소개 섹션 로고 교체

**Files:**
- Modify: `index.html:124-127`
- Modify: `static/css/style.css:395-407`

- [ ] **Step 1: HTML 변경 — 별 SVG를 img로 교체**

`index.html` line 125–127의 `<svg class="about-star">` 전체를 교체:

```html
<!-- 변경 전 -->
<svg class="about-star" viewBox="0 0 80 80" aria-hidden="true">
  <path d="M40 4 L48 32 L76 40 L48 48 L40 76 L32 48 L4 40 L32 32 Z" fill="#e8c23d" stroke="#15171a" stroke-width="2"/>
</svg>

<!-- 변경 후 -->
<img src="logo_image/chaek-primary-dark.svg" alt="" class="about-logo" aria-hidden="true">
```

- [ ] **Step 2: CSS — `.section-about`에 position 추가, `.about-logo` 추가**

`static/css/style.css` line 395–407을 아래로 교체:

```css
/* 변경 전 */
.section-about {
  padding: 80px 0;
  background: var(--cobalt);
  color: var(--paper-on-cobalt);
  border-bottom: 4px solid var(--ink);
  overflow: hidden;
}
.about-star {
  position: absolute; top: 40px; right: 40px;
  width: 80px; height: 80px;
  animation: spin-slow 14s linear infinite;
  pointer-events: none;
}

/* 변경 후 */
.section-about {
  position: relative;
  padding: 80px 0;
  background: var(--cobalt);
  color: var(--paper-on-cobalt);
  border-bottom: 4px solid var(--ink);
  overflow: hidden;
}
.about-logo {
  position: absolute; top: 40px; right: 40px;
  width: 72px; height: auto;
  pointer-events: none;
}
```

- [ ] **Step 3: 브라우저 확인**

브라우저에서 소개 섹션으로 스크롤해서:
- 우상단에 세로형 로고(흰색/레드)가 정적으로 표시되는지 확인
- 로고가 회전하지 않는지 확인
- 섹션 바깥으로 삐져나오지 않는지 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html static/css/style.css
git commit -m "feat(ui): 소개 섹션 별 장식을 chaek-primary-dark.svg로 교체"
```

---

## Task 3: 푸터 로고 교체

**Files:**
- Modify: `index.html:392-395`
- Modify: `static/css/style.css:1095-1101`

- [ ] **Step 1: HTML 변경 — 뱃지 스팬을 img로 교체**

`index.html` line 392–395의 `.footer-brand` 내부를 교체:

```html
<!-- 변경 전 -->
<p class="footer-brand">
  <span class="badge">책</span>
  <span>책책책 책을 읽읍시다!</span>
</p>

<!-- 변경 후 -->
<p class="footer-brand">
  <img src="logo_image/chaek-icon-dark.svg" alt="" class="footer-logo">
  <span>책책책 책을 읽읍시다!</span>
</p>
```

- [ ] **Step 2: CSS — `.footer-brand .badge` 제거 후 `.footer-logo` 추가**

`static/css/style.css` line 1095–1101을 아래로 교체:

```css
/* 변경 전 */
.footer-brand .badge {
  display: inline-block;
  background: var(--yellow); color: var(--ink);
  padding: 2px 8px; font-weight: 700;
  font-family: var(--serif);
  animation: jiggle 3s ease-in-out infinite;
}

/* 변경 후 */
.footer-logo {
  height: 24px;
  width: auto;
  display: block;
  flex-shrink: 0;
}
```

- [ ] **Step 3: 브라우저 확인**

페이지 최하단 푸터에서:
- 아이콘(책 3권) + "책책책 책을 읽읍시다!" 텍스트가 나란히 정렬되는지 확인
- 모바일에서도 줄바꿈 없이 잘 보이는지 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html static/css/style.css
git commit -m "feat(ui): 푸터 뱃지를 chaek-icon-dark.svg로 교체"
```

---

## Task 4: CTA 섹션 배경 장식 추가

**Files:**
- Modify: `index.html:375-387`
- Modify: `static/css/style.css:1007-1012`

- [ ] **Step 1: HTML 변경 — 배경 로고 img 추가**

`index.html` line 377 (`.cta-blob cobalt` 다음) 뒤에 img 태그 삽입:

```html
<!-- 변경 전 -->
<section class="section-cta">
  <div class="cta-blob yellow" aria-hidden="true"></div>
  <div class="cta-blob cobalt" aria-hidden="true"></div>
  <div class="container">

<!-- 변경 후 -->
<section class="section-cta">
  <div class="cta-blob yellow" aria-hidden="true"></div>
  <div class="cta-blob cobalt" aria-hidden="true"></div>
  <img src="logo_image/chaek-primary.svg" alt="" class="cta-logo-bg" aria-hidden="true">
  <div class="container">
```

- [ ] **Step 2: CSS — `.section-cta`에 position 추가, `.cta-logo-bg` 추가**

`static/css/style.css` line 1007–1012을 아래로 교체:

```css
/* 변경 전 */
.section-cta {
  padding: 100px 0;
  background: var(--red); color: var(--paper-on-red);
  border-bottom: 4px solid var(--ink);
  overflow: hidden;
}

/* 변경 후 */
.section-cta {
  position: relative;
  padding: 100px 0;
  background: var(--red); color: var(--paper-on-red);
  border-bottom: 4px solid var(--ink);
  overflow: hidden;
}
.cta-logo-bg {
  position: absolute;
  right: -20px;
  bottom: -20px;
  height: 280px;
  width: auto;
  opacity: 0.10;
  pointer-events: none;
}
```

- [ ] **Step 3: 브라우저 확인**

CTA 섹션에서:
- 오른쪽 하단에 로고가 희미하게 보이는지 확인 (opacity 10%)
- 텍스트·버튼을 가리지 않는지 확인
- 섹션 경계 바깥으로 넘치지 않는지 확인 (`overflow: hidden`)
- 모바일에서 과하게 크지 않은지 확인

- [ ] **Step 4: 커밋**

```bash
git add index.html static/css/style.css
git commit -m "feat(ui): CTA 섹션에 chaek-primary.svg 배경 장식 추가"
```

---

## Task 5: 최종 전체 검증

- [ ] **Step 1: 전체 페이지 흐름 확인**

브라우저에서 위에서 아래로 스크롤하며:
1. 네비바 — 가로형 로고 표시, 링크 동작
2. 소개 섹션 — 우상단 세로형 로고 (정적, 회전 없음)
3. 푸터 — 아이콘 + 텍스트 정렬
4. CTA — 배경 로고 희미하게

- [ ] **Step 2: 반응형 확인**

브라우저 DevTools에서 375px 폭으로 줄여 네비바 로고가 잘리지 않는지 확인.  
필요 시 `static/css/style.css` 미디어 쿼리 영역(line 1181 부근)에 `.nav-logo-img { height: 22px; }` 추가.
