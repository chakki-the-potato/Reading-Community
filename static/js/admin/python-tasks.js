import { callPython } from './pyodide-loader.js';
import { readWorkFiles, resetWorkDir, WORK_DIR, workPath } from './pyodide-workdir.js';

export async function runCheck({ inputs, argv, outputs }) {
  await resetWorkDir(inputs);
  const log = await callPython('check_runner', 'run_check', [WORK_DIR, argv]);
  return { log, files: await readWorkFiles(outputs) };
}

export async function findReviewCandidates({ chatPaths, membersPath, start, end, exam }) {
  const json = await callPython('review_candidates', 'review_candidates', [
    chatPaths.map(workPath), workPath(membersPath), start, end, exam?.start || '', exam?.end || '',
  ]);
  return JSON.parse(json);
}

export function setCell(csvText, name, date, value) {
  return callPython('record_cell', 'set_cell', [csvText, name, date, value]);
}
