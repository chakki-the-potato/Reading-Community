const compact = date => date.replaceAll('-', '');
const yearMonth = date => date.slice(0, 7).replace('-', '/');

export function recordFilename(start, end) {
  return `${yearMonth(start)}/verification_record_${compact(start)}_${compact(end)}.csv`;
}

export const recordPath = filename => `records/${filename}`;
export const metaPath = filename => `records/${filename.replace('.csv', '.json')}`;

export function membersPath(label, start) {
  return `members/${yearMonth(start)}/members_${label.replaceAll(' ', '')}.csv`;
}
