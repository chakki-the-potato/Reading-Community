import json
from collections import defaultdict
from datetime import date, datetime

import check_verification as cv

MAX_PREVIEW_MESSAGES = 4
MAX_PREVIEW_CHARS = 120

Message = tuple[date, str, str, str]


def _to_date(value: str) -> date | None:
    return datetime.strptime(value, '%Y-%m-%d').date() if value else None


def _load_messages(chat_paths: list[str]) -> list[Message]:
    messages: list[Message] = []
    for path in chat_paths:
        messages.extend(cv.parse_file(path))
    return cv.deduplicate_messages(messages)


def _group_by_member_day(messages: list[Message], members: list[str], start: date, end: date
                         ) -> tuple[dict[tuple[str, date], list[tuple[str, str]]], set[str]]:
    grouped: dict[tuple[str, date], list[tuple[str, str]]] = defaultdict(list)
    unmatched: set[str] = set()
    for msg_date, name, time_str, content in messages:
        if msg_date is None or not start <= msg_date <= end:
            continue
        member = cv._normalize_name(name, members)
        if member in members:
            grouped[(member, msg_date)].append((time_str, content))
        else:
            unmatched.add(name)
    return grouped, unmatched


def _failure_reason(contents: list[str]) -> str:
    has_photo = any(cv.is_photo_message(c) for c in contents)
    has_review = any(cv.is_review_message(c) for c in contents)
    if has_photo and not has_review:
        return "사진은 있는데 첫 줄에 '읽'이 들어간 감상문이 없어요"
    if has_review and not has_photo:
        return '감상문은 있는데 사진이 없어요'
    return "사진과 '읽'이 들어간 감상문이 모두 없어요"


def _to_candidate(member: str, day: date, items: list[tuple[str, str]]) -> dict:
    return {
        'name': member,
        'date': day.isoformat(),
        'reason': _failure_reason([content for _time, content in items]),
        'messages': [
            {'time': time_str, 'text': content[:MAX_PREVIEW_CHARS]}
            for time_str, content in items[:MAX_PREVIEW_MESSAGES]
        ],
    }


def review_candidates(chat_paths: list[str], members_path: str, start: str, end: str,
                      exam_start: str = '', exam_end: str = '') -> str:
    members = cv.load_members(members_path)
    messages = _load_messages(chat_paths)
    start_date, end_date = _to_date(start), _to_date(end)
    grouped, unmatched = _group_by_member_day(messages, members, start_date, end_date)
    verified, _active, _excluded = cv.check_verifications(
        messages, members, start_date, end_date,
        exam_start=_to_date(exam_start), exam_end=_to_date(exam_end),
    )
    candidates = [
        _to_candidate(member, day, items)
        for (member, day), items in sorted(grouped.items(), key=lambda kv: (kv[0][1], kv[0][0]))
        if not verified.get(member, {}).get(day, True)
    ]
    return json.dumps({'candidates': candidates, 'unmatched': sorted(unmatched)}, ensure_ascii=False)
