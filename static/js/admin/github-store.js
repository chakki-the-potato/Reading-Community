import { REPO } from './config.js';
import { getJson, REPO_URL } from './github-api.js';

const encodePath = path => path.split('/').map(encodeURIComponent).join('/');

function decodeBase64Utf8(b64) {
  const bytes = Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export async function readRemoteText(path) {
  const data = await getJson(`${REPO_URL}/contents/${encodePath(path)}?ref=${REPO.branch}`, `${path} 읽기`);
  return data ? decodeBase64Utf8(data.content) : null;
}

export async function listRemotePaths() {
  const data = await getJson(`${REPO_URL}/git/trees/${REPO.branch}?recursive=1`, '파일 목록 읽기');
  return data ? data.tree.filter(t => t.type === 'blob').map(t => t.path) : [];
}
