import { findQuarter, onQuartersChange } from './quarter-state.js';
import { columnToDate, parseRecord } from './record-csv.js';
import { recordPath } from './record-paths.js';
import { renderReviewList } from './review-list-view.js';
import { read } from './staged-changes.js';
import { $, fillSelect, runWithButton } from './ui.js';
import { applyVerificationFix } from './verification-fix.js';

let table = null;

function showCurrentValue() {
  const row = table?.rows.find(r => r.name === $('fixMember').value);
  const idx = $('fixDate').selectedIndex;
  $('fixCurrent').textContent = row && idx >= 0 ? `지금 값: ${row.cells[idx]}` : '';
}

async function loadTable() {
  const quarter = findQuarter($('fixQuarter').value);
  if (!quarter) return;
  const csv = await read(recordPath(quarter.filename));
  table = csv ? parseRecord(csv) : null;
  if (!table) return;
  const year = quarter.start_date.slice(0, 4);
  fillSelect($('fixMember'), table.rows.map(r => ({ value: r.name, label: r.name })));
  fillSelect($('fixDate'), table.dates.map(d => ({ value: columnToDate(d, year), label: d })));
  showCurrentValue();
}

export function showReview(review, quarter) {
  renderReviewList(review.candidates, async (candidate, value) => {
    await applyVerificationFix(quarter, candidate.name, candidate.date, value);
    await loadTable();
  });
}

export function initFixTab() {
  $('fixQuarter').addEventListener('change', loadTable);
  $('fixMember').addEventListener('change', showCurrentValue);
  $('fixDate').addEventListener('change', showCurrentValue);
  onQuartersChange(loadTable);
  document.querySelectorAll('.fix-value').forEach(btn => btn.addEventListener('click', () => (
    runWithButton(btn, $('fixError'), async () => {
      const quarter = findQuarter($('fixQuarter').value);
      if (!quarter || !table) throw new Error('분기를 고르세요.');
      await applyVerificationFix(quarter, $('fixMember').value, $('fixDate').value, btn.dataset.value);
      await loadTable();
    })
  )));
}
