import { reloadQuarters } from './quarter-state.js';
import { commitStaged, discardStaged, hasStagedChanges, onStagedChange } from './staged-changes.js';
import { $, errorText } from './ui.js';

function showState({ files }) {
  $('saveBtn').disabled = files.length === 0;
  $('discardBtn').hidden = files.length === 0;
  $('saveStatus').textContent = files.length ? `저장 안 된 파일 ${files.length}개` : '저장할 변경이 없어요';
}

async function saveAll() {
  const btn = $('saveBtn');
  btn.disabled = true;
  $('saveStatus').textContent = '저장하는 중이에요.';
  try {
    await commitStaged();
    $('saveStatus').textContent = '저장했어요. 1~2분 뒤 사이트에 반영돼요.';
  } catch (err) {
    console.error(err);
    $('saveStatus').textContent = errorText(err);
    btn.disabled = false;
  }
}

async function discardAll() {
  if (!window.confirm('저장하지 않은 변경을 모두 버릴까요?')) return;
  discardStaged();
  await reloadQuarters();
}

export function initSaveBar() {
  onStagedChange(showState);
  $('saveBtn').addEventListener('click', saveAll);
  $('discardBtn').addEventListener('click', discardAll);
  window.addEventListener('beforeunload', e => { if (hasStagedChanges()) e.preventDefault(); });
}
