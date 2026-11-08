import { PATHS } from './config.js';
import { readJson, stage } from './staged-changes.js';

export async function loadPaidMembers(filename) {
  const payments = (await readJson(PATHS.payments)) || {};
  return new Set(payments[filename] || []);
}

export async function setPaid(quarter, name, paid) {
  const payments = (await readJson(PATHS.payments)) || {};
  const names = new Set(payments[quarter.filename] || []);
  if (paid) names.add(name);
  else names.delete(name);
  const updated = { ...payments, [quarter.filename]: [...names].sort() };
  await stage({ [PATHS.payments]: JSON.stringify(updated, null, 2) + '\n' }, `${quarter.label} 납부 기록 수정`);
}
