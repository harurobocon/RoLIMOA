import unittest
from match_converter import (
    extract_match_id,
    resolve_winner_and_reason_rule,
    convert_payload_to_match_update,
    VTIME_SENTINEL,
)


class TestMatchConverter(unittest.TestCase):
    def test_extract_match_id(self):
        self.assertEqual(extract_match_id("MA-1"), "MA-1")
        self.assertEqual(extract_match_id("ma-1"), "MA-1")
        self.assertEqual(extract_match_id("MB-3"), "MB-3")
        self.assertEqual(extract_match_id("MK-7"), "MK-7")
        self.assertEqual(extract_match_id("MK1"), "MK-1")
        self.assertEqual(extract_match_id("M A - 1"), "MA-1")
        self.assertEqual(extract_match_id("予選第1試合 (MA-1)"), "MA-1")
        self.assertEqual(extract_match_id("決勝 MK-2 準々決勝"), "MK-2")
        self.assertIsNone(extract_match_id(""))
        self.assertIsNone(extract_match_id("テスト試合"))

    def test_rule_priority_1_vgoal(self):
        # Vゴール優先 (赤の方が早い)
        side, reason = resolve_winner_and_reason_rule(
            100, 100, 15, 20, {}, {}
        )
        self.assertEqual(side, "red")
        self.assertEqual(reason, "Vゴール")

    def test_rule_priority_2_score(self):
        # 得点差 (赤勝利)
        side, reason = resolve_winner_and_reason_rule(
            50, 30, VTIME_SENTINEL, VTIME_SENTINEL, {}, {}
        )
        self.assertEqual(side, "red")
        self.assertEqual(reason, "得点")

    def test_rule_priority_3_breakdown(self):
        # 得点は同点だが、城3段目(castle_tier3)で赤が多い
        red_tasks = {"castle_tier3": 1, "material_on_base": 0}
        blue_tasks = {"castle_tier3": 0, "material_on_base": 2}
        side, reason = resolve_winner_and_reason_rule(
            70, 70, VTIME_SENTINEL, VTIME_SENTINEL, red_tasks, blue_tasks
        )
        self.assertEqual(side, "red")
        self.assertEqual(reason, "城3段目獲得数")

        # 城3段目は同数だが、城2段目(castle_tier2)で青が多い
        red_tasks = {"castle_tier3": 1, "castle_tier2": 0}
        blue_tasks = {"castle_tier3": 1, "castle_tier2": 1}
        side, reason = resolve_winner_and_reason_rule(
            90, 90, VTIME_SENTINEL, VTIME_SENTINEL, red_tasks, blue_tasks
        )
        self.assertEqual(side, "blue")
        self.assertEqual(reason, "城2段目獲得数")

    def test_rule_priority_4_referee_decision(self):
        # 全項目同点、審判判定で赤選択
        side, reason = resolve_winner_and_reason_rule(
            50, 50, VTIME_SENTINEL, VTIME_SENTINEL, {}, {}, red_winner_flag=True, comment="審判判定"
        )
        self.assertEqual(side, "red")
        self.assertEqual(reason, "審判判定")

        # 全項目同点、審判判定で青選択
        side, reason = resolve_winner_and_reason_rule(
            50, 50, VTIME_SENTINEL, VTIME_SENTINEL, {}, {}, blue_winner_flag=True, comment="審判判定"
        )
        self.assertEqual(side, "blue")
        self.assertEqual(reason, "審判判定")

        # 全項目同点で未選択の場合はValueError
        with self.assertRaises(ValueError):
            resolve_winner_and_reason_rule(
                50, 50, VTIME_SENTINEL, VTIME_SENTINEL, {}, {}, red_winner_flag=False, blue_winner_flag=False
            )

    def test_convert_payload_with_match_id(self):
        payload = {
            "match": {
                "name": "予選第1試合",
                "matchId": "MA-1",
                "matchNo": 1,
            },
            "confirmedScore": {"red": 50, "blue": 30},
            "finalScore": {"fields": {"red": {}, "blue": {}}},
        }
        res = convert_payload_to_match_update(payload)
        self.assertEqual(res["match_id"], "MA-1")
        self.assertEqual(res["score_red"], 50)
        self.assertEqual(res["score_blue"], 30)
        self.assertEqual(res["winner_side"], "red")
        self.assertEqual(res["win_reason"], "得点")


if __name__ == "__main__":
    unittest.main()
