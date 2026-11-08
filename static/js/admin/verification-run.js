import { PATHS } from './config.js';
import { findReviewCandidates, runCheck } from './python-tasks.js';
import { allQuarters } from './quarter-state.js';
import { membersPath, metaPath, recordFilename, recordPath } from './record-paths.js';
import { read, stage } from './staged-changes.js';

const CHAT_DIR = 'chat';
const NO_REVIEW = Object.freeze({ candidates: [], unmatched: [] });

async function readRecordMetas() {
  const entries = await Promise.all(allQuarters().map(async q => {
    const path = metaPath(q.filename);
    const text = await read(path);
    if (text === null) throw new Error(`${path} 파일이 없어 분기 목록이 깨질 수 있어 멈췄습니다. 저장소를 관리하는 사람에게 알려주세요.`);
    return [path, text];
  }));
  return Object.fromEntries(entries);
}

async function readMembers(label, start) {
  const path = membersPath(label, start);
  const text = await read(path);
  if (text === null) throw new Error(`${label} 멤버 파일(${path})이 없습니다. "멤버·분기" 탭에서 먼저 멤버를 저장하세요.`);
  return { path, text };
}

async function collectInputs({ members, filename, chats, chatPaths }) {
  const [metas, index, payments, record] = await Promise.all([
    readRecordMetas(), read(PATHS.index), read(PATHS.payments), read(recordPath(filename)),
  ]);
  const optional = { [PATHS.index]: index, [PATHS.payments]: payments, [recordPath(filename)]: record };
  const inputs = { ...metas, [members.path]: members.text };
  Object.entries(optional).forEach(([path, text]) => { if (text !== null) inputs[path] = text; });
  chats.forEach((c, i) => { inputs[chatPaths[i]] = c.bytes; });
  return inputs;
}

function buildArgv({ membersFile, label, start, end, filename, exam, chatPaths }) {
  const argv = ['--members', membersFile, '--start', start, '--end', end,
    '--output', recordPath(filename), '--label', label];
  if (exam) argv.push('--exam-start', exam.start, '--exam-end', exam.end);
  return [...argv, ...chatPaths];
}

function throwOnScriptError(log) {
  const line = log.split('\n').find(l => l.startsWith('오류:'));
  if (line) throw new Error(line);
}

function withPaymentKey(paymentsText, filename) {
  const payments = JSON.parse(paymentsText);
  if (filename in payments) return paymentsText;
  return JSON.stringify({ ...payments, [filename]: [] }, null, 2) + '\n';
}

async function runVerification({ label, start, end, chats, exam, closeQuarter, summary }) {
  const members = await readMembers(label, start);
  const filename = recordFilename(start, end);
  const chatPaths = chats.map((c, i) => `${CHAT_DIR}/${i}-${c.name}`);
  const outputs = [recordPath(filename), metaPath(filename), PATHS.index, PATHS.payments];

  const { log, files } = await runCheck({
    inputs: await collectInputs({ members, filename, chats, chatPaths }),
    argv: buildArgv({ membersFile: members.path, label, start, end, filename, exam, chatPaths }),
    outputs,
  });
  throwOnScriptError(log);

  if (closeQuarter) files[PATHS.payments] = withPaymentKey(files[PATHS.payments], filename);
  await stage(files, summary);

  const review = chats.length
    ? await findReviewCandidates({ chatPaths, membersPath: members.path, start, end, exam })
    : NO_REVIEW;
  return { filename, review, record: files[recordPath(filename)] };
}

export function checkVerification({ quarter, chats, exam, closeQuarter }) {
  return runVerification({
    label: quarter.label, start: quarter.start_date, end: quarter.end_date, chats, exam, closeQuarter,
    summary: `${quarter.label} ${closeQuarter ? '분기 종료 인증' : '인증 중간 점검'}`,
  });
}

export function initializeQuarter({ label, start, end }) {
  return runVerification({
    label, start, end, chats: [], exam: null, closeQuarter: false, summary: `${label} 새 분기 등록`,
  });
}
