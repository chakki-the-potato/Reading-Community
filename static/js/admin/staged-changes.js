import { commitFiles } from './github-commit.js';
import { readRemoteText } from './github-store.js';

const pending = new Map();
const remoteCache = new Map();
const summaries = [];
const listeners = new Set();

const notify = () => listeners.forEach(fn => fn({ files: [...pending.keys()] }));

export function onStagedChange(fn) {
  listeners.add(fn);
}

export function hasStagedChanges() {
  return pending.size > 0;
}

export async function read(path) {
  if (pending.has(path)) return pending.get(path);
  if (!remoteCache.has(path)) remoteCache.set(path, await readRemoteText(path));
  return remoteCache.get(path);
}

export async function readJson(path) {
  const text = await read(path);
  return text === null ? null : JSON.parse(text);
}

export async function stage(files, summary) {
  let changed = false;
  for (const [path, content] of Object.entries(files)) {
    if ((await read(path)) === content) continue;
    pending.set(path, content);
    changed = true;
  }
  if (changed && !summaries.includes(summary)) summaries.push(summary);
  notify();
  return changed;
}

export function discardStaged() {
  pending.clear();
  summaries.length = 0;
  notify();
}

export async function commitStaged() {
  if (pending.size === 0) return null;
  const sha = await commitFiles(Object.fromEntries(pending), `chore(admin): ${summaries.join(', ')}`);
  pending.forEach((content, path) => remoteCache.set(path, content));
  discardStaged();
  return sha;
}
