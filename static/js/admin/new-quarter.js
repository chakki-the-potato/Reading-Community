import { serializeMembers } from './member-list.js';
import { membersPath } from './record-paths.js';
import { stage } from './staged-changes.js';
import { initializeQuarter } from './verification-run.js';

export function validateNewQuarter({ label, start, end, members }) {
  if (!label) return '분기 이름을 입력하세요. 예: 7월 1분기';
  if (!start || !end) return '시작일과 종료일을 고르세요.';
  if (start > end) return '시작일이 종료일보다 늦어요.';
  if (members.length === 0) return '멤버가 한 명 이상 있어야 해요.';
  return '';
}

export async function startNewQuarter({ label, start, end, members }) {
  await stage({ [membersPath(label, start)]: serializeMembers(members) }, `${label} 멤버 명단`);
  return initializeQuarter({ label, start, end });
}
