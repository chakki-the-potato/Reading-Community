import { REPO } from './config.js';
import { getJson, REPO_URL, sendJson } from './github-api.js';
import { getToken } from './github-token.js';

const FILE_MODE = '100644';

async function latestCommit() {
  const ref = await getJson(`${REPO_URL}/git/ref/heads/${REPO.branch}`, '최신 커밋 확인');
  if (!ref) throw new Error(`${REPO.branch} 브랜치를 찾을 수 없습니다. 저장소 설정을 확인하세요.`);
  const commit = await getJson(`${REPO_URL}/git/commits/${ref.object.sha}`, '최신 커밋 읽기');
  return { sha: ref.object.sha, treeSha: commit.tree.sha };
}

export async function commitFiles(files, message) {
  if (!getToken()) throw new Error('GitHub 토큰이 없어 저장할 수 없습니다. 화면 위 "GitHub 연결"에서 토큰을 넣어 주세요.');
  const parent = await latestCommit();
  const tree = await sendJson('POST', `${REPO_URL}/git/trees`, {
    base_tree: parent.treeSha,
    tree: Object.entries(files).map(([path, content]) => ({ path, mode: FILE_MODE, type: 'blob', content })),
  }, '파일 묶기');
  const commit = await sendJson('POST', `${REPO_URL}/git/commits`, {
    message, tree: tree.sha, parents: [parent.sha],
  }, '커밋 만들기');
  await sendJson('PATCH', `${REPO_URL}/git/refs/heads/${REPO.branch}`, { sha: commit.sha }, '저장소 반영');
  return commit.sha;
}
