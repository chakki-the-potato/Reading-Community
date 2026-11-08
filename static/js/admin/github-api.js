import { REPO } from './config.js';
import { getToken } from './github-token.js';

export const REPO_URL = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;
const GET_RETRIES = 3;
const RETRY_BASE_MS = 500;

function headers() {
  const token = getToken();
  return token
    ? { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` }
    : { Accept: 'application/vnd.github+json' };
}

function failureHint(status, body) {
  if (body.includes('rate limit')) return ' GitHub 조회 한도를 넘었어요. "GitHub 연결"에 토큰을 넣거나 1시간 뒤 다시 하세요.';
  if (status === 401 || status === 403) return ' GitHub 토큰이 맞는지, 저장 권한이 있는지 확인하세요.';
  return '';
}

async function failure(resp, action) {
  const body = await resp.text();
  return new Error(`${action} 실패 (상태 ${resp.status}).${failureHint(resp.status, body)}`);
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function getJson(url, action) {
  let lastError;
  for (let attempt = 0; attempt < GET_RETRIES; attempt += 1) {
    if (attempt > 0) await wait(RETRY_BASE_MS * 2 ** attempt);
    try {
      const resp = await fetch(url, { headers: headers(), cache: 'no-store' });
      if (resp.status === 404) return null;
      if (resp.ok) return resp.json();
      lastError = await failure(resp, action);
      if (resp.status < 500) break;
    } catch (err) {
      lastError = new Error(`${action} 중 네트워크 오류: ${err.message}. 인터넷 연결을 확인하세요.`);
    }
  }
  throw lastError;
}

export async function sendJson(method, url, body, action) {
  const resp = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
  if (!resp.ok) throw await failure(resp, action);
  return resp.json();
}
