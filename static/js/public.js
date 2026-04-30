// ===== 벌금 설정 =====
const PENALTY_PER_MISS = 2000;
const PENALTY_CAP = 10000;
const PENALTY_AFTER_CAP = 1000;

function calculatePenalty(missCount) {
  if (missCount <= 0) return 0;
  const capCount = Math.floor(PENALTY_CAP / PENALTY_PER_MISS);
  if (missCount <= capCount) return missCount * PENALTY_PER_MISS;
  return PENALTY_CAP + (missCount - capCount) * PENALTY_AFTER_CAP;
}

// ===== 납부 데이터 =====
let paymentsData = {};

async function loadPayments() {
  try {
    const resp = await fetch('records/payments.json');
    if (resp.ok) paymentsData = await resp.json();
  } catch (e) {
    paymentsData = {};
  }
}

// ===== CSV 파싱 =====
function parseSavedCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;

  const header = lines[0].split(',');
  const rateIdx = header.indexOf('인증률');
  const dateColumns = header.slice(1, rateIdx);

  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    const name = cols[0];
    const verifications = {};
    dateColumns.forEach((d, i) => {
      verifications[d] = cols[i + 1] === 'O';
    });
    const rate = cols[rateIdx];
    const penalty = cols.slice(rateIdx + 1).join(',');
    rows.push({ name, verifications, rate, penalty });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return { dateColumns, rows };
}

// ===== 요약 렌더링 =====
function renderPublicSummary(meta, dateColumns, rows, paidMembers) {
  const activeDays = dateColumns.length;
  const memberCount = rows.length;
  const excludedDates = meta.excluded_dates || [];
  const excludedCount = excludedDates.length;

  const excludedLabel = excludedDates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getMonth()+1}/${dt.getDate()}`;
  }).join(', ');

  let totalPenalty = 0;
  let unpaidPenalty = 0;
  for (const row of rows) {
    const ok = dateColumns.filter(d => row.verifications[d]).length;
    const miss = activeDays - ok;
    const penalty = calculatePenalty(miss);
    totalPenalty += penalty;
    if (penalty > 0 && !paidMembers.includes(row.name)) {
      unpaidPenalty += penalty;
    }
  }

  const chips = [
    { tone: 'cobalt', label: '활동일', value: `${activeDays}일` },
    { tone: 'red',    label: '멤버',   value: `${memberCount}명` },
    { tone: 'pink',   label: '제외일', value: excludedCount > 0 ? `${excludedCount}일` : '0일',
      sub: excludedCount > 0 ? `(${excludedLabel})` : '' },
    { tone: 'yellow', label: '총 벌금',   value: `${totalPenalty.toLocaleString()}원` },
    { tone: 'ink',    label: '미납 벌금', value: `${unpaidPenalty.toLocaleString()}원` },
  ];

  const html = chips.map(c => `
    <div class="summary-chip" data-tone="${c.tone}">
      <span class="label">${c.label}</span>
      <strong class="value">${c.value}</strong>
      ${c.sub ? `<span class="sub">${c.sub}</span>` : ''}
    </div>
  `).join('');

  document.getElementById('publicSummary').innerHTML = html;

  // Update header meta line
  const metaEl = document.getElementById('publicMeta');
  if (metaEl) metaEl.textContent = `${activeDays} DAYS · ${memberCount} MEMBERS`;
}

// ===== 날짜 범위 생성 =====
function buildFullDateRange(meta, dateColumns) {
  // start_date ~ period_end 사이의 모든 날짜를 "M/D" 형식으로 반환
  if (!meta.start_date) return { allDates: dateColumns, futureDates: new Set() };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(meta.start_date + 'T00:00:00');
  const periodEnd = meta.period_end
    ? new Date(meta.period_end + 'T00:00:00')
    : new Date(meta.end_date + 'T00:00:00');

  const allDates = [];
  const futureDates = new Set();
  const cur = new Date(start);
  while (cur <= periodEnd) {
    const label = `${cur.getMonth() + 1}/${cur.getDate()}`;
    allDates.push(label);
    if (cur > today) futureDates.add(label);
    cur.setDate(cur.getDate() + 1);
  }
  return { allDates, futureDates };
}

// ===== 테이블 렌더링 =====
function renderPublicTable(dateColumns, rows, paidMembers, meta = {}) {
  const { allDates, futureDates } = buildFullDateRange(meta, dateColumns);
  const dateColumnsSet = new Set(dateColumns);
  const activeDays = dateColumns.length;

  let html = '<table><thead><tr><th>이름</th>';
  for (const d of allDates) {
    html += `<th>${d}</th>`;
  }
  html += '<th>인증률</th><th>벌금</th><th>상태</th></tr></thead><tbody>';

  for (const row of rows) {
    html += `<tr><td>${row.name}</td>`;
    let ok = 0;
    for (const d of allDates) {
      if (futureDates.has(d) || !dateColumnsSet.has(d)) {
        html += `<td class="future"><span class="cell-mark">?</span></td>`;
      } else {
        const v = row.verifications[d];
        if (v) ok++;
        html += `<td class="${v ? 'pass' : 'fail'}"><span class="cell-mark">${v ? 'O' : 'X'}</span></td>`;
      }
    }
    const miss = activeDays - ok;
    const rate = activeDays > 0 ? Math.round(ok / activeDays * 100) : 0;
    const penalty = calculatePenalty(miss);
    html += `<td>${rate}%</td>`;
    html += `<td>${penalty.toLocaleString()}원</td>`;

    if (futureDates.size > 0) {
      html += '<td><span class="status-badge none">-</span></td>';
    } else if (penalty === 0) {
      html += '<td><span class="status-badge none">-</span></td>';
    } else if (paidMembers.includes(row.name)) {
      html += '<td><span class="status-badge paid">완료</span></td>';
    } else {
      html += '<td><span class="status-badge unpaid">미납</span></td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('publicTable').innerHTML = html;
}

// ===== 예정 화면 표시 =====
async function displayUpcoming(record) {
  document.getElementById('noData').style.display = 'none';
  document.getElementById('upcomingContent').style.display = 'flex';

  const period = `${record.start_date.replace(/-/g, '.')} ~ ${record.end_date.replace(/-/g, '.')}`;
  document.getElementById('upcomingPeriod').textContent = period;

  // 가장 최근 실제 기록을 blur 배경으로 로드
  const actual = recordsData.find(r => !r.upcoming && r.filename);
  if (actual) {
    const [csvResp, metaResp] = await Promise.all([
      fetch(`records/${actual.filename}`),
      fetch(`records/${actual.filename.replace('.csv', '.json')}`)
    ]);
    const csvText = await csvResp.text();
    let meta = {};
    if (metaResp.ok) meta = await metaResp.json();

    const parsed = parseSavedCSV(csvText);
    if (parsed) {
      const paidMembers = paymentsData[actual.filename] || [];
      renderPublicSummary(meta, parsed.dateColumns, parsed.rows, paidMembers);
      renderPublicTable(parsed.dateColumns, parsed.rows, paidMembers, meta);
      const pc = document.getElementById('publicContent');
      pc.style.display = 'block';
      pc.classList.add('blurred');
    }
  }
}

// ===== 데이터 표시 =====
function displayRecord(csvText, meta, filename) {
  document.getElementById('upcomingContent').style.display = 'none';

  const pc = document.getElementById('publicContent');
  pc.classList.remove('blurred');

  const parsed = parseSavedCSV(csvText);
  if (!parsed) {
    document.getElementById('noData').style.display = 'block';
    pc.style.display = 'none';
    return;
  }

  document.getElementById('noData').style.display = 'none';

  const paidMembers = paymentsData[filename] || [];
  renderPublicSummary(meta, parsed.dateColumns, parsed.rows, paidMembers);
  renderPublicTable(parsed.dateColumns, parsed.rows, paidMembers, meta);
  pc.style.display = 'block';
}

// ===== 기록 선택 드롭다운 =====
function formatDateRange(r) {
  const endDate = r.period_end || r.end_date;
  if (r.start_date && endDate) {
    return `${r.start_date.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`;
  }
  const m = r.filename.match(/(\d{4})(\d{2})(\d{2})_(\d{4})(\d{2})(\d{2})/);
  if (m) {
    return `${m[1]}.${m[2]}.${m[3]} ~ ${m[4]}.${m[5]}.${m[6]}`;
  }
  return '';
}

function formatRecordLabel(r) {
  const dateRange = formatDateRange(r);
  if (r.label) {
    return dateRange ? `${r.label} (${dateRange})` : r.label;
  }
  return dateRange || r.filename;
}

let recordsData = [];

async function loadRecordList() {
  const selector = document.getElementById('recordSelector');

  const resp = await fetch('records/index.json');
  const data = await resp.json();
  recordsData = data.records;

  if (data.records.length === 0) {
    selector.innerHTML = '<option value="">저장된 기록 없음</option>';
    document.getElementById('noData').style.display = 'block';
    return;
  }

  selector.innerHTML = data.records.map((r, i) => {
    const label = r.upcoming
      ? `${r.label} (예정)`
      : formatRecordLabel(r);
    const value = r.upcoming ? `upcoming:${i}` : r.filename;
    return `<option value="${value}" ${i === 0 ? 'selected' : ''}>${label}</option>`;
  }).join('');

  // 최신 기록 로드
  const first = data.records[0];
  if (first.upcoming) {
    displayUpcoming(first);
  } else {
    await loadRecord(first.filename);
  }
}

async function loadRecord(filename) {
  // CSV 파일과 메타데이터 JSON을 각각 fetch
  const [csvResp, metaResp] = await Promise.all([
    fetch(`records/${filename}`),
    fetch(`records/${filename.replace('.csv', '.json')}`)
  ]);

  const csvText = await csvResp.text();
  let meta = {};
  if (metaResp.ok) {
    meta = await metaResp.json();
  }

  displayRecord(csvText, meta, filename);
}

// ===== 네비게이션 스크롤 하이라이트 =====
function setupNavigation() {
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    }
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(section => observer.observe(section));
}

// ===== 히어로 지나면 네비게이션 노출 =====
function setupNavReveal() {
  const nav = document.getElementById('navbar');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  if (!('IntersectionObserver' in window)) {
    nav.classList.add('is-visible');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      nav.classList.toggle('is-visible', !entry.isIntersecting);
    }
  }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });

  io.observe(hero);
}

// ===== 스크롤 리빌 애니메이션 =====
function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || items.length === 0) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  items.forEach(el => io.observe(el));
}

// ===== 히어로 패럴랙스 (마우스 따라가는 blob) =====
function setupHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const blobs = hero.querySelectorAll('[data-parallax]');
  if (!blobs.length) return;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    blobs.forEach(b => {
      const sign = parseFloat(b.dataset.parallax) || 1;
      b.style.transform = `translate(${cx * 30 * sign}px, ${cy * 30 * sign}px)`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    blobs.forEach(b => { b.style.transform = ''; });
  });
}

// ===== 카운트업 (벌금 표 숫자) =====
function setupCounters() {
  const counters = document.querySelectorAll('[data-counter-target]');
  if (!counters.length) return;

  if (!('IntersectionObserver' in window)) {
    counters.forEach(el => {
      const target = parseInt(el.dataset.counterTarget, 10);
      el.textContent = target.toLocaleString();
    });
    return;
  }

  const animate = (el) => {
    const target = parseInt(el.dataset.counterTarget, 10) || 0;
    const duration = 1400;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(el => io.observe(el));
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupNavReveal();
  setupReveal();
  setupHeroParallax();
  setupCounters();
  await loadPayments();
  await loadRecordList();

  document.getElementById('recordSelector').addEventListener('change', async (e) => {
    const value = e.target.value;
    if (value && value.startsWith('upcoming:')) {
      const idx = parseInt(value.split(':')[1]);
      displayUpcoming(recordsData[idx]);
    } else if (value) {
      await loadRecord(value);
    }
  });
});
