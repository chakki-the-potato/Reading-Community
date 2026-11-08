import { PATHS } from './config.js';
import { readJson } from './staged-changes.js';
import { fillSelect } from './ui.js';

let quarters = [];
const listeners = new Set();

export function onQuartersChange(fn) {
  listeners.add(fn);
}

export function findQuarter(filename) {
  return quarters.find(q => q.filename === filename);
}

export function allQuarters() {
  return quarters;
}

const optionLabel = q => `${q.label} (${q.start_date.slice(5)} ~ ${q.end_date.slice(5)})`;

export async function reloadQuarters() {
  const index = await readJson(PATHS.index);
  quarters = (index?.records || []).filter(r => !r.upcoming && r.filename);
  const options = quarters.map(q => ({ value: q.filename, label: optionLabel(q) }));
  document.querySelectorAll('.quarter-select').forEach(s => fillSelect(s, options));
  listeners.forEach(fn => fn(quarters));
}
