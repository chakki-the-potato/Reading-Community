const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const toDate = iso => new Date(`${iso}T00:00:00`);
const pad = v => String(v).padStart(2, '0');

export function addDays(iso, n) {
  const d = toDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function koreanDate(iso) {
  const d = toDate(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function koreanDateWithDay(iso) {
  return `${koreanDate(iso)}(${WEEKDAYS[toDate(iso).getDay()]})`;
}
