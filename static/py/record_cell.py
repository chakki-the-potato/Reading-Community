import csv
import io
from datetime import datetime

import check_verification as cv

ALLOWED_VALUES = ('O', 'X', '?')
RATE_COLUMN = '인증률'


def _column_name(day: str) -> str:
    d = datetime.strptime(day, '%Y-%m-%d').date()
    return f'{d.month}/{d.day}'


def _summary_cells(cells: list[str]) -> tuple[str, str]:
    if all(c == '?' for c in cells):
        return '?%', '?원'
    verified = sum(1 for c in cells if c == 'O')
    rate = verified / len(cells) * 100
    return f'{rate:.0f}%', f'{cv.calculate_penalty(len(cells) - verified):,}원'


def _write_rows(rows: list[list[str]], keep_crlf: bool) -> str:
    out = io.StringIO()
    csv.writer(out, lineterminator='\r\n' if keep_crlf else '\n').writerows(rows)
    return out.getvalue()


def set_cell(csv_text: str, name: str, day: str, value: str) -> str:
    if value not in ALLOWED_VALUES:
        raise ValueError(f'허용되지 않는 값입니다: {value!r}. O, X, ? 중 하나를 쓰세요.')
    rows = list(csv.reader(io.StringIO(csv_text)))
    header = rows[0]
    rate_idx = header.index(RATE_COLUMN)
    column = _column_name(day)
    if column not in header[1:rate_idx]:
        raise ValueError(f'{column} 날짜가 이 기록에 없습니다. 분기 기간을 확인하세요.')
    row = next((r for r in rows[1:] if r and r[0].strip() == name), None)
    if row is None:
        raise ValueError(f'{name} 멤버가 이 기록에 없습니다. 멤버 이름을 확인하세요.')
    row[header.index(column)] = value
    row[rate_idx], row[rate_idx + 1] = _summary_cells(row[1:rate_idx])
    return _write_rows(rows, '\r\n' in csv_text)
