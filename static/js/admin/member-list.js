import { listRemotePaths } from './github-store.js';

const MEMBERS_FILE = /^members\/\d{4}\/\d{2}\/.+\.csv$/;
const HEADER = '이름';

export async function latestMembersPath() {
  const paths = (await listRemotePaths()).filter(p => MEMBERS_FILE.test(p));
  return paths.sort().at(-1) || null;
}

export function parseMembers(text) {
  return text.replace(/^﻿/, '').split(/\r?\n/).slice(1).map(s => s.trim()).filter(Boolean);
}

export function serializeMembers(names) {
  return [HEADER, ...[...names].sort()].join('\n') + '\n';
}
