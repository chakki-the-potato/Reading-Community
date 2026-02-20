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
  return { dateColumns, rows };
}

// ===== 요약 렌더링 =====
function renderPublicSummary(meta, dateColumns, rows) {
  const activeDays = dateColumns.length;
  const memberCount = rows.length;
  const excludedDates = meta.excluded_dates || [];
  const excludedCount = excludedDates.length;

  const excludedLabel = excludedDates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getMonth()+1}/${dt.getDate()}`;
  }).join(', ');

  let html = `
    <div class="summary-item">활동일<strong>${activeDays}일</strong></div>
    <div class="summary-item">멤버<strong>${memberCount}명</strong></div>
  `;
  if (excludedCount > 0) {
    html += `<div class="summary-item">제외일<strong>${excludedCount}일</strong><span style="font-size:0.75rem;color:var(--gray-500);display:block">(${excludedLabel})</span></div>`;
  }

  let totalPenalty = 0;
  for (const row of rows) {
    const ok = dateColumns.filter(d => row.verifications[d]).length;
    const miss = activeDays - ok;
    totalPenalty += calculatePenalty(miss);
  }
  html += `<div class="summary-item">총 벌금<strong>${totalPenalty.toLocaleString()}원</strong></div>`;

  document.getElementById('publicSummary').innerHTML = html;
}

// ===== 테이블 렌더링 =====
function renderPublicTable(dateColumns, rows) {
  const activeDays = dateColumns.length;
  let html = '<table><thead><tr><th>이름</th>';
  for (const d of dateColumns) {
    html += `<th>${d}</th>`;
  }
  html += '<th>인증률</th><th>벌금</th></tr></thead><tbody>';

  for (const row of rows) {
    html += `<tr><td>${row.name}</td>`;
    let ok = 0;
    for (const d of dateColumns) {
      const v = row.verifications[d];
      if (v) ok++;
      html += `<td class="${v ? 'pass' : 'fail'}">${v ? 'O' : 'X'}</td>`;
    }
    const miss = activeDays - ok;
    const rate = activeDays > 0 ? Math.round(ok / activeDays * 100) : 0;
    const penalty = calculatePenalty(miss);
    html += `<td>${rate}%</td>`;
    html += `<td>${penalty > 0 ? penalty.toLocaleString() + '원' : '-'}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('publicTable').innerHTML = html;
}

// ===== 데이터 표시 =====
function displayRecord(csvText, meta) {
  const parsed = parseSavedCSV(csvText);
  if (!parsed) {
    document.getElementById('noData').style.display = 'block';
    document.getElementById('publicContent').style.display = 'none';
    return;
  }

  document.getElementById('noData').style.display = 'none';

  renderPublicSummary(meta, parsed.dateColumns, parsed.rows);
  renderPublicTable(parsed.dateColumns, parsed.rows);
  document.getElementById('publicContent').style.display = 'block';
}

// ===== 기록 선택 드롭다운 =====
function formatDateRange(r) {
  if (r.start_date && r.end_date) {
    return `${r.start_date.replace(/-/g, '.')} ~ ${r.end_date.replace(/-/g, '.')}`;
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

async function loadRecordList() {
  const selector = document.getElementById('recordSelector');

  const resp = await fetch('records/index.json');
  const data = await resp.json();

  if (data.records.length === 0) {
    selector.innerHTML = '<option value="">저장된 기록 없음</option>';
    document.getElementById('noData').style.display = 'block';
    return;
  }

  selector.innerHTML = data.records.map((r, i) => {
    const label = formatRecordLabel(r);
    return `<option value="${r.filename}" ${i === 0 ? 'selected' : ''}>${label}</option>`;
  }).join('');

  // 최신 기록 로드
  await loadRecord(data.records[0].filename);
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

  displayRecord(csvText, meta);
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

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadRecordList();

  document.getElementById('recordSelector').addEventListener('change', async (e) => {
    const filename = e.target.value;
    if (filename) {
      await loadRecord(filename);
    }
  });
});
