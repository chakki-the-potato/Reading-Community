# check_verification 이름 정규화 동작을 검증한다.
from datetime import date
import unittest

from check_verification import _normalize_name, check_verifications


class NameNormalizationTest(unittest.TestCase):
    def test_normalizes_chat_name_when_full_member_name_is_embedded(self):
        members = ["김민진"]

        normalized_name = _normalize_name("한화 김민진", members)

        self.assertEqual(normalized_name, "김민진")

    def test_does_not_guess_partial_or_initial_aliases(self):
        members = ["김민진"]

        self.assertEqual(_normalize_name("민진", members), "민진")
        self.assertEqual(_normalize_name("MJ", members), "MJ")

    def test_embedded_member_name_counts_toward_verification(self):
        members = ["김민진"]
        messages = [
            (date(2026, 5, 18), "한화 김민진", "23:53:07", "사진 2장"),
            (
                date(2026, 5, 18),
                "한화 김민진",
                "23:56:32",
                "사랑을 연습한 시간을 읽었습니다.",
            ),
        ]

        result, active_dates, excluded_dates = check_verifications(
            messages,
            members,
            date(2026, 5, 18),
            date(2026, 5, 18),
        )

        self.assertEqual(excluded_dates, [])
        self.assertEqual(active_dates, [date(2026, 5, 18)])
        self.assertTrue(result["김민진"][date(2026, 5, 18)])


if __name__ == "__main__":
    unittest.main()
