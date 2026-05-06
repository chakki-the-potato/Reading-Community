# 로고 배치 디자인 스펙

## 목표

새로 추가된 SVG 로고 파일들을 사이트 4개 영역에 배치해 브랜딩 일관성을 높인다.
히어로 섹션은 현재 디자인이 충분히 강하므로 변경하지 않는다.

---

## 배치 1 — 네비게이션 바

**현재 HTML** (`index.html` line 18–21):
```html
<a href="#top" class="nav-logo">
  <span class="book-mark" aria-hidden="true"></span>
  <span>책책책</span>
</a>
```

**변경 후**:
```html
<a href="#top" class="nav-logo">
  <img src="logo_image/chaek-horizontal-dark.svg" alt="책책책" class="nav-logo-img">
</a>
```

**CSS 변경** (`style.css`):
- `.nav-logo` — `gap`, `font-*`, `color` 제거 (이미지가 텍스트 대체)
- `.nav-logo .book-mark`, `.nav-logo .book-mark::before` — 삭제
- `.nav-logo-img` 추가: `height: 28px; width: auto; display: block;`

---

## 배치 2 — 소개 섹션 (About)

**현재 HTML** (`index.html` line 125–127):
```html
<svg class="about-star" viewBox="0 0 80 80" aria-hidden="true">
  <path d="M40 4 L48 32 L76 40 ..." fill="#e8c23d" .../>
</svg>
```

**변경 후**:
```html
<img src="logo_image/chaek-primary-dark.svg" alt="" class="about-logo" aria-hidden="true">
```

**CSS 변경**:
- `.about-star` 규칙 유지(position/top/right)하되 `animation` 제거 → 로고가 회전하면 이상함
- 클래스명: HTML에서 `about-star` → `about-logo`로 변경, CSS에 `.about-logo` 규칙 신규 추가
- `width: 72px; height: auto;` (별 80px과 유사한 크기)

---

## 배치 3 — 푸터

**현재 HTML** (`index.html` line 392–395):
```html
<p class="footer-brand">
  <span class="badge">책</span>
  <span>책책책 책을 읽읍시다!</span>
</p>
```

**변경 후**:
```html
<p class="footer-brand">
  <img src="logo_image/chaek-icon-dark.svg" alt="책책책" class="footer-logo">
  <span>책책책 책을 읽읍시다!</span>
</p>
```

**CSS 변경**:
- `.footer-brand .badge` — 삭제
- `.footer-logo` 추가: `height: 28px; width: auto; display: inline-block; vertical-align: middle;`
- `.footer-brand` — `align-items: center; gap: 10px;` (flex 정렬)

---

## 배치 4 — CTA 섹션

**현재 HTML** (`index.html` line 375–387):
```html
<section class="section-cta">
  <div class="cta-blob yellow" aria-hidden="true"></div>
  <div class="cta-blob cobalt" aria-hidden="true"></div>
  <div class="container"> ... </div>
</section>
```

**변경 후**: blob 다음에 장식 이미지 추가
```html
<img src="logo_image/chaek-primary.svg" alt="" class="cta-logo-bg" aria-hidden="true">
```

**CSS 추가** (`.cta-logo-bg`):
```css
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
`.section-cta`에 `overflow: hidden`은 이미 있음. `position: relative`는 없으므로 추가 필요.

---

## 검증

1. 브라우저에서 `index.html` 직접 열기
2. 네비바: 로고 이미지가 표시되고 클릭 시 `#top` 이동
3. 소개 섹션 스크롤: 로고가 우상단에 정적으로 표시 (회전 없음)
4. 푸터: 아이콘 + 텍스트 나란히 정렬
5. CTA 섹션: 배경에 로고가 희미하게 보이되 텍스트/버튼을 가리지 않음
6. 모바일 뷰포트(375px): 네비바 로고 크기가 잘 맞는지 확인
