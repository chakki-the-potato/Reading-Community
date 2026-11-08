import { addDays } from './dates.js';
import { currentMembers, initMemberEditor } from './member-editor.js';
import { startNewQuarter, validateNewQuarter } from './new-quarter.js';
import { getPython } from './pyodide-loader.js';
import { onQuartersChange, reloadQuarters } from './quarter-state.js';
import { $, runWithButton } from './ui.js';

function suggestStartDate(quarters) {
  if (quarters[0] && !$('newStart').value) $('newStart').value = addDays(quarters[0].end_date, 1);
}

function readForm() {
  return {
    label: $('newLabel').value.trim(),
    start: $('newStart').value,
    end: $('newEnd').value,
    members: currentMembers(),
  };
}

export function initQuarterTab() {
  const status = $('quarterStatus');
  initMemberEditor();
  onQuartersChange(suggestStartDate);

  $('quarterStart').addEventListener('click', e => runWithButton(e.currentTarget, $('quarterError'), async () => {
    const form = readForm();
    const invalid = validateNewQuarter(form);
    if (invalid) throw new Error(invalid);
    status.textContent = '새 분기를 만드는 중이에요. 처음에는 10초쯤 걸려요.';
    await getPython();
    await startNewQuarter(form);
    await reloadQuarters();
    status.textContent = `${form.label} 등록 준비 완료. 맨 아래 "저장"을 누르면 사이트에 나타나요.`;
  }, status));
}
