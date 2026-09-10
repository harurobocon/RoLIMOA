import re
from typing import Any, Dict, Optional


def format_team(team: Optional[Dict[str, Any]], fallback: str) -> str:
    if not team:
        return fallback
    school = (team.get("school") or "").strip()
    name = (team.get("name") or team.get("shortName") or "").strip()

    if school and name:
        return f"{school}「{name}」"
    if name:
        return f"「{name}」"
    if school:
        return school
    return fallback


def format_score(score_value: Any, field_score: Optional[Dict[str, Any]]) -> str:
    if not field_score:
        return str(score_value if score_value is not None else 0)

    # Vゴール判定
    vgoal_time = field_score.get("vgoal")
    if vgoal_time is not None:
        try:
            sec = int(vgoal_time)
            if sec >= 60:
                time_str = f"{sec // 60}分{sec % 60}秒" if sec % 60 != 0 else f"{sec // 60}分"
            else:
                time_str = f"{sec}秒"
        except (ValueError, TypeError):
            time_str = f"{vgoal_time}秒"
        return f"Vゴール {time_str}"

    return str(score_value if score_value is not None else 0)


def determine_winner(
    red_field: Optional[Dict[str, Any]],
    blue_field: Optional[Dict[str, Any]],
    red_score: Any,
    blue_score: Any,
    red_team: Optional[Dict[str, Any]],
    blue_team: Optional[Dict[str, Any]],
) -> str:
    # 1. 審判・システムによるwinnerフラグを優先
    red_winner = bool(red_field and red_field.get("winner"))
    blue_winner = bool(blue_field and blue_field.get("winner"))

    if red_winner and not blue_winner:
        return (red_team.get("name") or red_team.get("shortName") or "赤チーム") if red_team else "赤チーム"
    if blue_winner and not red_winner:
        return (blue_team.get("name") or blue_team.get("shortName") or "青チーム") if blue_team else "青チーム"

    # 2. Vゴール判定
    red_vgoal = red_field.get("vgoal") if red_field else None
    blue_vgoal = blue_field.get("vgoal") if blue_field else None
    if red_vgoal is not None and blue_vgoal is None:
        return (red_team.get("name") or red_team.get("shortName") or "赤チーム") if red_team else "赤チーム"
    if blue_vgoal is not None and red_vgoal is None:
        return (blue_team.get("name") or blue_team.get("shortName") or "青チーム") if blue_team else "青チーム"

    # 3. スコア比較
    try:
        r = float(red_score)
        b = float(blue_score)
        if r > b:
            return (red_team.get("name") or red_team.get("shortName") or "赤チーム") if red_team else "赤チーム"
        if b > r:
            return (blue_team.get("name") or blue_team.get("shortName") or "青チーム") if blue_team else "青チーム"
    except (ValueError, TypeError):
        pass

    # 4. 引き分けなしルール：フォールバック（winnerフラグ等未設定の場合）
    return (blue_team.get("name") or blue_team.get("shortName") or "青チーム") if blue_team else "青チーム"


def format_tweet(payload: Dict[str, Any], default_hashtags: str = "#関東夏ロボコン #夏ロボコン") -> str:
    """
    試合確定イベント (resultRecords/addResult) の payload からツイート本文を生成する。
    フォーマット例:
    予選第20試合 豊田工業高等専門学校「とよたし♡ロボコンブ」VS 東京大学「The Canon」 0 - Vゴール 15秒 でThe Canonの勝利です！ 素早い回収と6連続の投擲により「ファンファーレ」を達成しました！ #関東春ロボコン #春ロボコン
    """
    match = payload.get("match") or {}
    match_name = (match.get("name") or "試合結果").strip()

    teams = match.get("teams") or {}
    red_team = teams.get("red")
    blue_team = teams.get("blue")

    red_team_str = format_team(red_team, "赤チーム")
    blue_team_str = format_team(blue_team, "青チーム")

    confirmed_score = payload.get("confirmedScore") or {}
    red_score_val = confirmed_score.get("red", 0)
    blue_score_val = confirmed_score.get("blue", 0)

    final_score = payload.get("finalScore") or {}
    fields = final_score.get("fields") or {}
    red_field = fields.get("red")
    blue_field = fields.get("blue")

    red_score_str = format_score(red_score_val, red_field)
    blue_score_str = format_score(blue_score_val, blue_field)

    winner_name = determine_winner(
        red_field=red_field,
        blue_field=blue_field,
        red_score=red_score_val,
        blue_score=blue_score_val,
        red_team=red_team,
        blue_team=blue_team,
    )

    comment = (payload.get("comment") or "").strip()
    hashtags = default_hashtags.strip()

    lines = [
        match_name,
        f"{red_team_str}VS {blue_team_str}",
        f"{red_score_str} - {blue_score_str}",
        f"で{winner_name}の勝利です！",
    ]
    if comment:
        lines.append(comment)
    if hashtags:
        lines.append(hashtags)

    return "\n".join(lines)
