import { ADMIN_LOGIN } from './config.js';
import { $ } from './ui.js';

const SESSION_KEY = 'chaek-admin-session';

export function isLoggedIn() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberLogin(value) {
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('세션 저장 실패', err);
  }
}

function loginError(id, pw) {
  if (!id || !pw) return '아이디와 비밀번호를 입력하세요.';
  if (id !== ADMIN_LOGIN.id || pw !== ADMIN_LOGIN.password) return '아이디나 비밀번호가 맞지 않아요.';
  return '';
}

export function initLogin(onSuccess) {
  const error = $('loginError');
  ['loginId', 'loginPw'].forEach(id => $(id).addEventListener('input', () => { error.textContent = ''; }));
  $('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    error.textContent = loginError($('loginId').value.trim(), $('loginPw').value);
    if (error.textContent) return;
    rememberLogin(true);
    onSuccess();
  });
  $('logoutBtn').addEventListener('click', () => {
    rememberLogin(false);
    window.location.reload();
  });
}
