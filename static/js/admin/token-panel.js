import { getToken, setToken } from './github-token.js';
import { $ } from './ui.js';

function refreshButtonLabel() {
  $('tokenBtn').textContent = getToken() ? 'GitHub 연결됨' : 'GitHub 연결';
}

function saveToken() {
  const value = $('tokenInput').value.trim();
  if (!value) { $('tokenMsg').textContent = '토큰을 붙여넣으세요.'; return; }
  setToken(value);
  $('tokenInput').value = '';
  $('tokenMsg').textContent = '저장했어요.';
  $('tokenPanel').hidden = true;
  refreshButtonLabel();
}

export function initTokenPanel() {
  const panel = $('tokenPanel');
  refreshButtonLabel();
  panel.hidden = Boolean(getToken());
  $('tokenBtn').addEventListener('click', () => { panel.hidden = !panel.hidden; });
  $('tokenSave').addEventListener('click', saveToken);
}
