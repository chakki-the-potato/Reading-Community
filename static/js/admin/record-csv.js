const RATE_COLUMN = '인증률';
const NO_PENALTY = new Set(['0원', '?원']);

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseRecord(text) {
  const [header, ...rows] = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map(parseCsvLine);
  const rateIdx = header.indexOf(RATE_COLUMN);
  return {
    dates: header.slice(1, rateIdx),
    rows: rows.map(r => ({ name: r[0], cells: r.slice(1, rateIdx), rate: r[rateIdx], penalty: r[rateIdx + 1] })),
  };
}

export const hasPenalty = row => !NO_PENALTY.has(row.penalty);

export function columnToDate(column, year) {
  const [m, d] = column.split('/');
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
