import { generalNotice, quarterEndNotice, recruitNotice, settlementNotice } from './announcements.js';
import { addDays, koreanDate, koreanDateWithDay } from './dates.js';
import { findQuarter, onQuartersChange } from './quarter-state.js';
import { $, checkedValue } from './ui.js';

const COPY_RESET_MS = 1500;
const BLANK_LABEL = '○월 ○분기';
const BLANK_DATE = '○월 ○일';

function buildNotice(kind, quarter, nextLabel) {
  const label = quarter?.label || BLANK_LABEL;
  if (kind === 'settlement') return settlementNotice({ label });
  if (kind === 'general') return generalNotice();
  if (kind === 'recruit') return recruitNotice();
  return quarterEndNotice({
    label,
    endDate: quarter ? koreanDateWithDay(quarter.end_date) : BLANK_DATE,
    nextLabel: nextLabel || BLANK_LABEL,
    deadline: quarter ? koreanDate(addDays(quarter.end_date, -1)) : BLANK_DATE,
  });
}

function render() {
  const kind = checkedValue('noticeKind');
  document.querySelectorAll('#noticeFields [data-for]').forEach(el => {
    el.hidden = !el.dataset.for.split(' ').includes(kind);
  });
  $('noticeText').value = buildNotice(kind, findQuarter($('noticeQuarter').value), $('noticeNext').value.trim());
}

async function copyNotice() {
  const btn = $('noticeCopy');
  try {
    await navigator.clipboard.writeText($('noticeText').value);
    btn.textContent = '복사됨';
  } catch {
    $('noticeText').select();
    btn.textContent = 'Ctrl+C로 복사하세요';
  }
  setTimeout(() => { btn.textContent = '복사'; }, COPY_RESET_MS);
}

export function initNoticeTab() {
  document.querySelectorAll('input[name="noticeKind"]').forEach(r => r.addEventListener('change', render));
  $('noticeQuarter').addEventListener('change', render);
  $('noticeNext').addEventListener('input', render);
  $('noticeCopy').addEventListener('click', copyNotice);
  onQuartersChange(render);
}
