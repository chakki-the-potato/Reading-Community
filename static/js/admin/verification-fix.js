import { setCell } from './python-tasks.js';
import { recordPath } from './record-paths.js';
import { read, stage } from './staged-changes.js';

export async function applyVerificationFix(quarter, name, date, value) {
  const path = recordPath(quarter.filename);
  const csv = await read(path);
  if (csv === null) throw new Error(`${quarter.label} 기록 파일이 없습니다.`);
  await stage({ [path]: await setCell(csv, name, date, value) }, `${quarter.label} 인증 수정`);
}
