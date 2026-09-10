import re
from typing import Any, Dict, Optional, Tuple

# homepageのmatches/utils.py で定義されている定数
VTIME_SENTINEL = 999

# 大会ごとの優先度設定を読み込み
try:
    from rule_config import BREAKDOWN_PRIORITY_KEYS
except ImportError:
    from .rule_config import BREAKDOWN_PRIORITY_KEYS


def extract_match_id(match_name: str) -> Optional[str]:
    """
    試合名文字列から M{英字1文字}-{数字} の形式の match_id を抽出する。
    例:
      - "MA-1" -> "MA-1"
      - "mb-2" -> "MB-2"
      - "MK-7" -> "MK-7"
      - "予選第1試合 (MA-1)" -> "MA-1"
      - "MK1" -> "MK-1"
    """
    if not match_name:
        return None

    pattern = re.compile(r"M\s*([a-zA-Z])\s*-?\s*([0-9]+)", re.IGNORECASE)
    match = pattern.search(match_name)
    if match:
        block_letter = match.group(1).upper()
        match_number = match.group(2)
        return f"M{block_letter}-{match_number}"

    return None


def resolve_winner_and_reason_rule(
    score_red: int,
    score_blue: int,
    vtime_red: int,
    vtime_blue: int,
    red_tasks: Dict[str, int],
    blue_tasks: Dict[str, int],
    red_winner_flag: bool = False,
    blue_winner_flag: bool = False,
    comment: str = "",
) -> Tuple[str, str]:
    """
    ルールブック2.13.1に基づいて、勝者サイド ("red" | "blue") と勝利理由を決定する。

    優先順位:
    1) 「築城」（Vゴール）を先に達成したチーム
    2) 得点の高いチーム
    3) 2.10.1のより下にある得点をより多く獲得したチーム
    4) 審判の判定 (同点時または手動オーバーライド時)
    """
    # 0. 手動オーバーライド / 審判判定指定（RoLIMOAで明示的に指定された場合）
    # コメントに「審判判定」が含まれているか、または同点時にどちらかのフラグが立っている場合
    is_explicit_referee_decision = "審判判定" in comment

    # 1. 「築城」（Vゴール）判定
    if vtime_red != VTIME_SENTINEL or vtime_blue != VTIME_SENTINEL:
        if vtime_red < vtime_blue:
            return "red", "Vゴール"
        elif vtime_blue < vtime_red:
            return "blue", "Vゴール"

    # 2. 得点差判定
    if score_red > score_blue:
        if is_explicit_referee_decision and blue_winner_flag and not red_winner_flag:
            return "blue", "審判判定"
        return "red", "得点"
    elif score_blue > score_red:
        if is_explicit_referee_decision and red_winner_flag and not blue_winner_flag:
            return "red", "審判判定"
        return "blue", "得点"

    # 3. 2.10.1のより下にある得点をより多く獲得したチーム
    for key, reason_label in BREAKDOWN_PRIORITY_KEYS:
        r_val = int(red_tasks.get(key) or 0)
        b_val = int(blue_tasks.get(key) or 0)
        if r_val > b_val:
            if is_explicit_referee_decision and blue_winner_flag and not red_winner_flag:
                return "blue", "審判判定"
            return "red", reason_label
        elif b_val > r_val:
            if is_explicit_referee_decision and red_winner_flag and not blue_winner_flag:
                return "red", "審判判定"
            return "blue", reason_label

    # 4. 審判の判定 (ルール 1), 2), 3) で全て同等)
    if red_winner_flag and not blue_winner_flag:
        return "red", "審判判定"
    elif blue_winner_flag and not red_winner_flag:
        return "blue", "審判判定"

    # 同点でどちらも選ばれていない場合
    raise ValueError(
        f"ルール2.13.1に基づき得点・獲得項目が同点ですが、審判判定（勝者）が選択されていません。"
        f"RoLIMOAの主審画面で赤または青チームの勝利を選択してください。"
    )


def convert_payload_to_match_update(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    RoLIMOA の resultRecords/addResult ペイロードを
    homepage matches アプリの update_match_result API が要求する辞書に変換する。
    """
    match_info = payload.get("match") or {}
    match_name = match_info.get("name") or ""
    match_id = extract_match_id(match_name)

    if not match_id:
        raise ValueError(
            f"試合名 '{match_name}' から match_id (例: MA-1, MK-1) を抽出できませんでした"
        )

    # スコアの取得
    confirmed_score = payload.get("confirmedScore") or {}
    score_red = int(confirmed_score.get("red", 0))
    score_blue = int(confirmed_score.get("blue", 0))

    # finalScore の取得
    final_score = payload.get("finalScore") or {}
    fields = final_score.get("fields") or {}
    red_field = fields.get("red") or {}
    blue_field = fields.get("blue") or {}

    # タスク進行状況
    red_tasks = red_field.get("tasks") or {}
    blue_tasks = blue_field.get("tasks") or {}

    # Vタイム（未達成または未定義なら 999）
    raw_vtime_red = red_field.get("vgoal")
    raw_vtime_blue = blue_field.get("vgoal")

    vtime_red = int(round(raw_vtime_red)) if raw_vtime_red is not None else VTIME_SENTINEL
    vtime_blue = int(round(raw_vtime_blue)) if raw_vtime_blue is not None else VTIME_SENTINEL

    # 勝者フラグ
    red_winner_flag = bool(red_field.get("winner", False))
    blue_winner_flag = bool(blue_field.get("winner", False))
    comment = str(payload.get("comment") or "")

    winner_side, win_reason = resolve_winner_and_reason_rule(
        score_red=score_red,
        score_blue=score_blue,
        vtime_red=vtime_red,
        vtime_blue=vtime_blue,
        red_tasks=red_tasks,
        blue_tasks=blue_tasks,
        red_winner_flag=red_winner_flag,
        blue_winner_flag=blue_winner_flag,
        comment=comment,
    )

    return {
        "match_id": match_id,
        "score_red": score_red,
        "score_blue": score_blue,
        "vtime_red": vtime_red,
        "vtime_blue": vtime_blue,
        "winner_side": winner_side,
        "win_reason": win_reason,
    }
