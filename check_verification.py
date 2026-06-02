#!/usr/bin/env python3
"""카카오톡 독서 소모임 인증 체크 자동화 스크립트"""

import re
import csv
import argparse
from datetime import datetime, date, timedelta
from collections import defaultdict



# --- 설정 ---

DAWN_CUTOFF_HOUR = 5  # 새벽 5시 기준: 0시~4시59분은 전날 인증

# 사진 마커
PHOTO_MARKERS = ['사진', 'Photo', '사진을 보냈습니다', '동영상']

# 감상문 판별: 첫 줄에 '읽' 키워드 필수, 최소 3줄
REVIEW_FIRST_LINE_KEYWORD = '읽'
REVIEW_MIN_LINES = 1

# 벌금 설정
PENALTY_PER_MISS = 2000       # 미인증 1회당 벌금
PENALTY_CAP = 10000           # 이 금액 초과 시 할인 적용
PENALTY_AFTER_CAP = 1000      # 초과 후 1회당 벌금


# --- 카카오톡 텍스트 파싱 ---

DATE_LINE_PATTERNS = [
    re.compile(r'-+\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*-+'),
]

MESSAGE_PATTERNS = [
    # PC: [이름] [오후 3:00] 메시지
    re.compile(
        r'^\[(?P<name>[^\]]+)\]\s*'
        r'\[(?P<ampm>오전|오후)\s*(?P<hour>\d{1,2}):(?P<minute>\d{2})\]\s*'
        r'(?P<content>.+)$'
    ),
    # Android: 2026년 2월 19일 오후 3:00, 이름 : 메시지
    re.compile(
        r'^(?P<year>\d{4})년\s*(?P<month>\d{1,2})월\s*(?P<day>\d{1,2})일\s*'
        r'(?P<ampm>오전|오후)\s*(?P<hour>\d{1,2}):(?P<minute>\d{2}),\s*'
        r'(?P<name>[^:]+?)\s*:\s*(?P<content>.+)$'
    ),
    # iOS: 2026. 2. 19. 오후 3:00, 이름 : 메시지
    re.compile(
        r'^(?P<year>\d{4})\.\s*(?P<month>\d{1,2})\.\s*(?P<day>\d{1,2})\.\s*'
        r'(?P<ampm>오전|오후)\s*(?P<hour>\d{1,2}):(?P<minute>\d{2}),\s*'
        r'(?P<name>[^:]+?)\s*:\s*(?P<content>.+)$'
    ),
]


def to_24h(ampm, hour):
    """오전/오후 + 12시간제 hour를 24시간제로 변환한다."""
    if ampm == '오전':
        return 0 if hour == 12 else hour
    else:
        return hour if hour == 12 else hour + 12


def get_effective_date_from_hour(msg_date, hour_24):
    """새벽 5시 기준으로 인증 날짜를 보정한다."""
    if hour_24 < DAWN_CUTOFF_HOUR:
        return msg_date - timedelta(days=1)
    return msg_date


# --- 파일 파싱 ---

def detect_file_format(filepath):
    """파일 형식을 자동 감지한다. 'csv', 'simple_csv', 또는 'kakao' 반환."""
    encodings = ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                first_line = f.readline().strip()
                if first_line.startswith('Date,') or first_line.startswith('"Date"'):
                    return 'csv', enc
                # YYYY.M.D HH:MM,이름,메시지 형식 (헤더 없는 단순 CSV)
                if re.match(r'^\d{4}\.\d{1,2}\.\d{1,2}\s+\d{1,2}:\d{2},', first_line):
                    return 'simple_csv', enc
                return 'kakao', enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return 'kakao', 'utf-8'


def parse_simple_csv_file(filepath, encoding='utf-8'):
    """YYYY.M.D HH:MM,이름,메시지 형식 (헤더 없는 단순 CSV)을 파싱한다."""
    messages = []
    dt_pattern = re.compile(r'^(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})$')

    with open(filepath, 'r', encoding=encoding) as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 3:
                continue
            date_str = row[0].strip()
            m = dt_pattern.match(date_str)
            if not m:
                continue
            year, month, day, hour, minute = (int(x) for x in m.groups())
            dt = datetime(year, month, day, hour, minute)
            user = row[1].strip()
            content = row[2].strip()
            if not user or not content:
                continue
            eff_date = get_effective_date_from_hour(dt.date(), dt.hour)
            time_str = dt.strftime('%H:%M:%S')
            messages.append((eff_date, user, time_str, content))

    return messages


_SIMPLE_DT_PATTERN = re.compile(r'^(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})$')

def _parse_csv_date(date_str):
    """CSV Date 컬럼 값을 datetime으로 파싱한다. 여러 형식을 시도한다."""
    date_str = date_str.strip()
    try:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    except ValueError:
        pass
    m = _SIMPLE_DT_PATTERN.match(date_str)
    if m:
        year, month, day, hour, minute = (int(x) for x in m.groups())
        return datetime(year, month, day, hour, minute)
    raise ValueError(f"날짜 형식 인식 불가: {date_str!r}")


def parse_csv_file(filepath, encoding='utf-8-sig'):
    """Date,User,Message CSV 파일을 파싱한다."""
    messages = []  # (effective_date, name, time_str, content)

    with open(filepath, 'r', encoding=encoding) as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                dt = _parse_csv_date(row['Date'])
            except (ValueError, KeyError):
                continue

            user = row.get('User', '').strip()
            content = row.get('Message', '').strip()
            if not user or not content:
                continue

            eff_date = get_effective_date_from_hour(dt.date(), dt.hour)
            time_str = dt.strftime('%H:%M:%S')
            messages.append((eff_date, user, time_str, content))

    return messages


def parse_kakao_file(filepath, encoding='utf-8'):
    """카카오톡 텍스트 내보내기 파일을 파싱한다."""
    messages = []
    current_date = None

    with open(filepath, 'r', encoding=encoding) as f:
        lines = f.readlines()

    for line in lines:
        line = line.rstrip('\n')

        d = parse_date_line(line)
        if d:
            current_date = d
            continue

        result = parse_message_line(line, current_date)
        if result:
            messages.append(result)

    return messages


def parse_date_line(line):
    """날짜 구분선에서 날짜를 추출한다."""
    for pattern in DATE_LINE_PATTERNS:
        m = pattern.search(line)
        if m:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def parse_message_line(line, current_date):
    """카카오톡 메시지 줄을 파싱한다."""
    for pattern in MESSAGE_PATTERNS:
        m = pattern.match(line.strip())
        if not m:
            continue

        groups = m.groupdict()
        name = groups['name'].strip()
        ampm = groups['ampm']
        hour = int(groups['hour'])
        minute = int(groups['minute'])
        content = groups['content'].strip()

        if 'year' in groups:
            msg_date = date(int(groups['year']), int(groups['month']), int(groups['day']))
        else:
            msg_date = current_date

        h24 = to_24h(ampm, hour)
        effective_date = get_effective_date_from_hour(msg_date, h24) if msg_date else msg_date
        time_str = f"{ampm} {hour}:{minute:02d}"
        return (effective_date, name, time_str, content)

    return None


def parse_file(filepath):
    """파일 형식을 자동 감지하여 파싱한다."""
    fmt, enc = detect_file_format(filepath)
    if fmt == 'csv':
        return parse_csv_file(filepath, enc)
    elif fmt == 'simple_csv':
        return parse_simple_csv_file(filepath, enc)
    else:
        return parse_kakao_file(filepath, enc)


# --- 인증 판정 ---

def is_photo_message(content):
    """메시지 내용이 사진 첨부인지 확인한다."""
    stripped = content.strip()
    for marker in PHOTO_MARKERS:
        if stripped == marker or stripped == f'[{marker}]':
            return True
    # "사진 2장", "사진 3장" 등
    if re.match(r'^사진\s*\d+장$', stripped):
        return True
    return False


def is_review_message(content):
    """메시지 내용이 독서 후기인지 확인한다.
    조건: 최소 1줄 이상 + 첫 줄에 '읽' 키워드 포함.
    """
    lines = [l.strip() for l in content.strip().split('\n') if l.strip()]
    if len(lines) < REVIEW_MIN_LINES:
        return False
    return REVIEW_FIRST_LINE_KEYWORD in lines[0]


def is_verified(messages, exam_mode=False):
    """인증 판정. exam_mode=True면 사진만 있어도 인증, 아니면 사진+감상문 둘 다 필요."""
    has_photo = any(is_photo_message(c) for c in messages)
    if not has_photo:
        return False
    if exam_mode:
        return True
    return any(is_review_message(c) for c in messages)


def _normalize_name(name: str, members: list[str]) -> str:
    """채팅 이름을 멤버 이름으로 정규화한다.
    예: '김민지 Minji Kim' → '김민지', '한화 김민진' → '김민진'
    """
    if name in members:
        return name
    candidates = [member for member in members if member and member in name]
    if len(candidates) == 1:
        return candidates[0]
    return name


def check_verifications(messages, members, start_date, end_date, excluded_dates=None,
                        exam_start=None, exam_end=None):
    """멤버별/날짜별 인증 여부를 판정한다.
    exam_start~exam_end 범위의 날짜는 사진만 있어도 인증으로 인정한다.
    """
    # 멤버별/날짜별 메시지 그룹핑 (시간순 유지)
    member_day_msgs = defaultdict(list)

    for msg_date, name, time_str, content in messages:
        if msg_date is None:
            continue
        if msg_date < start_date or msg_date > end_date:
            continue
        name = _normalize_name(name, members)
        if name not in members:
            continue

        member_day_msgs[(name, msg_date)].append(content)

    # 날짜 범위 생성
    all_dates = []
    d = start_date
    while d <= end_date:
        all_dates.append(d)
        d += timedelta(days=1)

    # 제외일 필터링
    excluded = set(excluded_dates) if excluded_dates else set()
    active_dates = [d for d in all_dates if d not in excluded]
    excluded_in_range = [d for d in all_dates if d in excluded]

    # 인증 판정 (시험 기간은 사진만 있어도 OK)
    result = {}
    for name in members:
        result[name] = {}
        for d in active_dates:
            msgs = member_day_msgs.get((name, d), [])
            exam_mode = exam_start is not None and exam_end is not None and exam_start <= d <= exam_end
            result[name][d] = is_verified(msgs, exam_mode=exam_mode)

    return result, active_dates, excluded_in_range


# --- 벌금 계산 ---

def calculate_penalty(miss_count):
    """미인증 횟수에 따른 벌금을 계산한다.
    - 기본: 1회당 2,000원
    - 누적 10,000원 초과 시 이후 1회당 1,000원
    """
    if miss_count <= 0:
        return 0

    # 2,000원으로 10,000원에 도달하는 횟수
    cap_count = PENALTY_CAP // PENALTY_PER_MISS  # 5회

    if miss_count <= cap_count:
        return miss_count * PENALTY_PER_MISS
    else:
        return PENALTY_CAP + (miss_count - cap_count) * PENALTY_AFTER_CAP


# --- 중복 필터링 ---

def deduplicate_messages(messages):
    """(날짜, 이름, 시간, 내용) 기준으로 중복 메시지를 제거한다."""
    seen = set()
    unique = []
    for msg in messages:
        if msg not in seen:
            seen.add(msg)
            unique.append(msg)
    return unique


# --- CSV 입출력 ---

def load_members(filepath):
    """멤버 CSV 파일에서 이름 목록을 읽어온다."""
    members = []
    encodings = ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr']

    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('이름', '').strip()
                    if name:
                        members.append(name)
            return members
        except (UnicodeDecodeError, UnicodeError):
            continue
        except KeyError:
            with open(filepath, 'r', encoding=enc) as f:
                reader = csv.reader(f)
                next(reader, None)
                for row in reader:
                    if row and row[0].strip():
                        members.append(row[0].strip())
            return members

    print(f"경고: {filepath} 파일을 읽을 수 없습니다.")
    return members


def load_existing_record(filepath):
    """기존 기록 CSV 파일을 읽어온다."""
    existing = {}
    existing_dates = set()
    encodings = ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr']

    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if not header:
                    return existing, existing_dates

                date_columns = []
                for i, col in enumerate(header[1:], start=1):
                    if col in ('인증률', '벌금'):
                        break
                    try:
                        month, day = col.split('/')
                        d = date(datetime.now().year, int(month), int(day))
                        date_columns.append((i, d))
                        existing_dates.add(d)
                    except (ValueError, IndexError):
                        continue

                for row in reader:
                    if not row:
                        continue
                    name = row[0].strip()
                    existing[name] = {}
                    for col_idx, d in date_columns:
                        if col_idx < len(row):
                            existing[name][d] = row[col_idx].strip() == 'O'

            return existing, existing_dates
        except FileNotFoundError:
            return existing, existing_dates
        except (UnicodeDecodeError, UnicodeError):
            continue

    return existing, existing_dates


def save_record(filepath, members, result, sorted_dates, existing=None, existing_dates=None, placeholder=False):
    """인증 기록을 CSV 파일로 저장한다."""
    import os
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    all_dates = set(sorted_dates)
    if existing_dates:
        all_dates.update(existing_dates)
    all_dates = sorted(all_dates)

    merged = {}
    for name in members:
        merged[name] = {}
        if existing and name in existing:
            merged[name].update(existing[name])
        if name in result:
            merged[name].update(result[name])

    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)

        header = ['이름'] + [f"{d.month}/{d.day}" for d in all_dates] + ['인증률', '벌금']
        writer.writerow(header)

        for name in members:
            if placeholder:
                row = [name] + ['?'] * len(all_dates) + ['?%', '?원']
            else:
                row = [name]
                verified_count = 0
                for d in all_dates:
                    v = merged[name].get(d, False)
                    row.append('O' if v else 'X')
                    if v:
                        verified_count += 1
                rate = (verified_count / len(all_dates) * 100) if all_dates else 0
                miss_count = len(all_dates) - verified_count
                penalty = calculate_penalty(miss_count)
                row.append(f"{rate:.0f}%")
                row.append(f"{penalty:,}원")
            writer.writerow(row)

    return filepath


def update_index_json(records_dir):
    """records 디렉토리의 JSON 메타데이터를 재귀 탐색하여 index.json을 갱신한다.
    upcoming 항목은 기존 index.json에서 보존한다."""
    import json, os, glob

    # 기존 upcoming 항목 보존
    index_path = os.path.join(records_dir, 'index.json')
    upcoming_records = []
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        upcoming_records = [r for r in existing.get('records', []) if r.get('upcoming')]

    records = []
    for json_path in glob.glob(os.path.join(records_dir, '**', 'verification_record_*.json'), recursive=True):
        with open(json_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
        csv_path = json_path.replace('.json', '.csv')
        rel_path = os.path.relpath(csv_path, records_dir).replace('\\', '/')
        records.append({
            'filename': rel_path,
            'start_date': meta.get('start_date', ''),
            'end_date': meta.get('end_date', ''),
            'period_end': meta.get('period_end', ''),
            'label': meta.get('label', ''),
            'saved_at': meta.get('saved_at', ''),
        })
    records.sort(key=lambda r: r['start_date'], reverse=True)

    # upcoming 항목을 맨 앞에 추가 (start_date 내림차순 유지)
    all_records = sorted(
        upcoming_records + records,
        key=lambda r: r.get('start_date', ''),
        reverse=True
    )

    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump({'records': all_records}, f, ensure_ascii=False, indent=2)


def print_result_table(members, result, sorted_dates, placeholder=False):
    """결과를 터미널에 표 형태로 출력한다.
    placeholder=True면 모든 셀과 인증률/벌금을 '?'로 표시한다.
    """
    if not sorted_dates:
        print("해당 기간에 메시지가 없습니다.")
        return

    name_width = max((len(name) for name in members), default=4)
    name_width = max(name_width, 4)

    date_headers = [f"{d.day}" for d in sorted_dates]
    col_width = max(max(len(h) for h in date_headers), 2)

    header = f"{'이름':<{name_width}}"
    for h in date_headers:
        header += f"  {h:>{col_width}}"
    header += "  인증률  벌금"
    print(header)
    print("-" * len(header))

    for name in members:
        row = f"{name:<{name_width}}"
        if placeholder:
            for _ in sorted_dates:
                row += f"  {'?':>{col_width}}"
            row += f"  {'?%':>5}  {'?원':>7}"
            print(row)
            continue
        verified_count = 0
        for d in sorted_dates:
            v = result.get(name, {}).get(d, False)
            mark = 'O' if v else 'X'
            row += f"  {mark:>{col_width}}"
            if v:
                verified_count += 1
        total = len(sorted_dates)
        miss_count = total - verified_count
        rate = (verified_count / total * 100) if total else 0
        penalty = calculate_penalty(miss_count)
        row += f"  {rate:>4.0f}%  {penalty:>6,}원"
        print(row)


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(
        description='카카오톡 독서 소모임 인증 체크 자동화'
    )
    parser.add_argument(
        'chat_files', nargs='*',
        help='채팅 파일 (.txt 또는 .csv), 여러 개 가능 (생략 시 전원 ? 상태로 초기화)'
    )
    parser.add_argument(
        '--members', '-m', required=True,
        help='멤버 명단 CSV 파일'
    )
    parser.add_argument(
        '--start', '-s', required=True,
        help='시작 날짜 (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--end', '-e', required=True,
        help='종료 날짜 (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--output', '-o', default=None,
        help='결과 CSV 파일 경로 (지정하면 기존 파일에 누적)'
    )
    parser.add_argument(
        '--exclude', '-x', nargs='*', default=[],
        help='제외할 날짜 목록 (YYYY-MM-DD), 여러 개 가능'
    )
    parser.add_argument(
        '--label', '-l', default='',
        help='기록 이름 (예: "9월", "10월 1분기")'
    )
    parser.add_argument(
        '--period-end', '-p', default=None,
        help='전체 기간 종료 날짜 (YYYY-MM-DD). 미지정 시 해당 월의 마지막 날'
    )
    parser.add_argument(
        '--exam-start', default=None,
        help='시험 기간 시작 (YYYY-MM-DD, --exam-end와 함께 지정). 이 기간은 사진만 있어도 인증'
    )
    parser.add_argument(
        '--exam-end', default=None,
        help='시험 기간 종료 (YYYY-MM-DD, --exam-start와 함께 지정)'
    )

    args = parser.parse_args()

    # 시험 기간 검증: 둘 다 주어지거나 둘 다 없어야 함
    if bool(args.exam_start) != bool(args.exam_end):
        print("오류: --exam-start와 --exam-end는 함께 지정해야 합니다.")
        return
    exam_start = datetime.strptime(args.exam_start, '%Y-%m-%d').date() if args.exam_start else None
    exam_end = datetime.strptime(args.exam_end, '%Y-%m-%d').date() if args.exam_end else None
    if exam_start and exam_end and exam_start > exam_end:
        print("오류: --exam-start가 --exam-end보다 늦습니다.")
        return

    # 멤버 로드
    members = load_members(args.members)
    if not members:
        print("오류: 멤버 목록이 비어 있습니다.")
        return

    print(f"멤버 {len(members)}명: {', '.join(members)}")

    # 파일 파싱 (형식 자동 감지)
    all_messages = []
    for filepath in args.chat_files:
        msgs = parse_file(filepath)
        print(f"  {filepath}: {len(msgs)}개 메시지")
        all_messages.extend(msgs)

    # 중복 제거
    before = len(all_messages)
    all_messages = deduplicate_messages(all_messages)
    after = len(all_messages)
    if before != after:
        print(f"  중복 제거: {before}개 → {after}개 ({before - after}개 제거)")

    # 날짜 범위
    start_date = datetime.strptime(args.start, '%Y-%m-%d').date()
    end_date = datetime.strptime(args.end, '%Y-%m-%d').date()

    # 제외일 파싱
    excluded_dates = [datetime.strptime(d, '%Y-%m-%d').date() for d in args.exclude]

    unmatched_names = sorted({
        name
        for msg_date, name, _time_str, _content in all_messages
        if msg_date is not None
        and start_date <= msg_date <= end_date
        and _normalize_name(name, members) not in members
    })
    if unmatched_names:
        print("\n경고: 멤버와 매칭되지 않은 채팅 이름이 있습니다.")
        print("별칭, 부분 이름, 이니셜인 경우 자동 처리하지 않았으니 확인이 필요합니다.")
        print(f"  {', '.join(unmatched_names)}")

    # 인증 판정
    result, active_dates, excluded_in_range = check_verifications(
        all_messages, members, start_date, end_date, excluded_dates,
        exam_start=exam_start, exam_end=exam_end
    )

    if exam_start and exam_end:
        print(f"시험 기간: {exam_start} ~ {exam_end} (이 기간은 사진만 있어도 인증)")
    if excluded_in_range:
        print(f"\n제외일: {', '.join(f'{d.month}/{d.day}' for d in excluded_in_range)}")
    print(f"활동일: {len(active_dates)}일\n")

    # 결과 출력
    is_placeholder = len(args.chat_files) == 0
    print_result_table(members, result, active_dates, placeholder=is_placeholder)

    # CSV 저장
    if args.output:
        existing, existing_dates = load_existing_record(args.output)
        saved = save_record(args.output, members, result, active_dates, existing, existing_dates, placeholder=is_placeholder)
    else:
        import os
        start_str = active_dates[0].strftime('%Y%m%d') if active_dates else 'unknown'
        end_str = active_dates[-1].strftime('%Y%m%d') if active_dates else 'unknown'
        year = active_dates[0].strftime('%Y') if active_dates else 'unknown'
        month = active_dates[0].strftime('%m') if active_dates else 'unknown'
        subdir = f"records/{year}/{month}"
        os.makedirs(subdir, exist_ok=True)
        default_output = f"{subdir}/verification_record_{start_str}_{end_str}.csv"
        saved = save_record(default_output, members, result, active_dates, placeholder=is_placeholder)
    print(f"\n결과 저장: {saved}")

    # JSON 메타데이터 저장
    import json, os
    if args.period_end:
        period_end = datetime.strptime(args.period_end, '%Y-%m-%d').date()
    else:
        period_end = end_date

    meta = {
        'start_date': str(start_date),
        'end_date': str(end_date),
        'period_end': str(period_end),
        'excluded_dates': [str(d) for d in excluded_dates],
        'label': args.label,
        'saved_at': datetime.now().isoformat()
    }
    if exam_start and exam_end:
        meta['exam_start'] = str(exam_start)
        meta['exam_end'] = str(exam_end)
    meta_path = saved.replace('.csv', '.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"메타데이터 저장: {meta_path}")

    # index.json 갱신
    update_index_json('records')
    print(f"index.json 갱신 완료")

    # placeholder 모드: payments.json에 새 분기 키를 빈 배열로 자동 추가
    if is_placeholder:
        payments_path = 'records/payments.json'
        rel_key = os.path.relpath(saved, 'records').replace('\\', '/')
        try:
            with open(payments_path, 'r', encoding='utf-8') as f:
                payments = json.load(f)
        except FileNotFoundError:
            payments = {}
        if rel_key not in payments:
            payments[rel_key] = []
            with open(payments_path, 'w', encoding='utf-8') as f:
                json.dump(payments, f, ensure_ascii=False, indent=2)
                f.write('\n')
            print(f"payments.json에 빈 배열 키 추가: {rel_key}")


if __name__ == '__main__':
    main()
