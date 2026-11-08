import { loadPaidMembers, setPaid } from './payment-records.js';
import { findQuarter, onQuartersChange } from './quarter-state.js';
import { hasPenalty, parseRecord } from './record-csv.js';
import { recordPath } from './record-paths.js';
import { read } from './staged-changes.js';
import { $, errorText, h } from './ui.js';

function summaryText(fined, paid) {
  if (fined.length === 0) return '이 분기에는 벌금 대상이 없어요.';
  return `벌금 대상 ${fined.length}명 중 ${fined.filter(r => paid.has(r.name)).length}명 납부`;
}

async function onToggle(quarter, name, box) {
  box.disabled = true;
  try {
    await setPaid(quarter, name, box.checked);
    await render();
  } catch (err) {
    console.error(err);
    box.checked = !box.checked;
    $('paySummary').textContent = errorText(err);
  } finally {
    box.disabled = false;
  }
}

function payRow(quarter, row, paid) {
  const box = h('input', { type: 'checkbox' });
  box.checked = paid;
  box.addEventListener('change', () => onToggle(quarter, row.name, box));
  return h('label', { class: 'pay-row' }, [box, h('span', { text: row.name }), h('span', { class: 'hint', text: row.penalty })]);
}

async function render() {
  const quarter = findQuarter($('payQuarter').value);
  if (!quarter) return;
  const [csv, paid] = await Promise.all([read(recordPath(quarter.filename)), loadPaidMembers(quarter.filename)]);
  const fined = csv ? parseRecord(csv).rows.filter(hasPenalty) : [];
  $('paySummary').textContent = summaryText(fined, paid);
  $('payList').replaceChildren(...fined.map(r => payRow(quarter, r, paid.has(r.name))));
}

export function initPaymentsTab() {
  $('payQuarter').addEventListener('change', render);
  onQuartersChange(render);
}
