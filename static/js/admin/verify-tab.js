import { getPython } from './pyodide-loader.js';
import { findQuarter, reloadQuarters } from './quarter-state.js';
import { metaPath } from './record-paths.js';
import { readJson } from './staged-changes.js';
import { $, checkedValue, runWithButton } from './ui.js';
import { checkVerification } from './verification-run.js';
import { renderVerifyResult } from './verify-result-view.js';

const DEFAULT_FILE_LABEL = '카톡에서 내보낸 .txt 또는 .csv 파일을 고르세요';

function setExam(start, end) {
  const on = Boolean(start && end);
  $('examToggle').checked = on;
  $('examDates').hidden = !on;
  $('examStart').value = start || '';
  $('examEnd').value = end || '';
}

async function prefillExam(filename) {
  const meta = await readJson(metaPath(filename));
  setExam(meta?.exam_start, meta?.exam_end);
}

function readExam() {
  if (!$('examToggle').checked) return null;
  const exam = { start: $('examStart').value, end: $('examEnd').value };
  if (!exam.start || !exam.end) throw new Error('시험 기간 시작일과 종료일을 모두 고르세요.');
  if (exam.start > exam.end) throw new Error('시험 시작일이 종료일보다 늦어요.');
  return exam;
}

function readChats(files) {
  return Promise.all([...files].map(async f => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
}

export function initVerifyTab({ onReview }) {
  const fileInput = $('chatFile');
  const status = $('verifyStatus');

  $('examToggle').addEventListener('change', e => { $('examDates').hidden = !e.target.checked; });
  $('verifyQuarter').addEventListener('change', e => prefillExam(e.target.value));
  fileInput.addEventListener('change', () => {
    $('chatLabel').textContent = [...fileInput.files].map(f => f.name).join(', ') || DEFAULT_FILE_LABEL;
    $('verifyError').textContent = '';
  });

  $('verifyRun').addEventListener('click', e => runWithButton(e.currentTarget, $('verifyError'), async () => {
    const quarter = findQuarter($('verifyQuarter').value);
    if (!quarter) throw new Error('분기를 고르세요.');
    if (fileInput.files.length === 0) throw new Error('카톡 파일을 먼저 고르세요.');
    const exam = readExam();
    status.textContent = '계산 준비 중이에요. 처음에는 10초쯤 걸려요.';
    await getPython();
    status.textContent = '인증을 확인하는 중이에요.';
    const result = await checkVerification({
      quarter, exam, chats: await readChats(fileInput.files), closeQuarter: checkedValue('verifyMode') === 'end',
    });
    status.textContent = '끝났어요. 아래 결과를 확인하고, 맞으면 맨 아래 "저장"을 누르세요.';
    renderVerifyResult(result, quarter);
    onReview(result.review, quarter);
    await reloadQuarters();
  }, status));
}
