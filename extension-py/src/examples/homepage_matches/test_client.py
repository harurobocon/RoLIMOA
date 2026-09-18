import argparse
import json
import os
from pathlib import Path
from dotenv import load_dotenv
import httpx

# .env の読み込み
ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()


def main():
    parser = argparse.ArgumentParser(description="homepage matches API 直接疎通テストツール")
    parser.add_argument(
        "--api-url",
        type=str,
        default=os.environ.get(
            "HOMEPAGE_API_URL", "http://localhost:8000/staff/matches/api/update/"
        ),
        help="homepage matches update API URL (デフォルト: http://localhost:8000/staff/matches/api/update/)",
    )
    parser.add_argument(
        "--api-token",
        type=str,
        default=os.environ.get("HOMEPAGE_API_TOKEN") or os.environ.get("GAS_API_TOKEN") or "",
        help="API認証トークン (環境変数 HOMEPAGE_API_TOKEN または GAS_API_TOKEN でも指定可)",
    )
    parser.add_argument("--match-id", type=str, default="MA-1", help="試合ID (例: MA-1, MK-1)")
    parser.add_argument("--score-red", type=int, default=50, help="赤チーム得点")
    parser.add_argument("--score-blue", type=int, default=30, help="青チーム得点")
    parser.add_argument("--vtime-red", type=int, default=999, help="赤チームVタイム (秒、未達成時は999)")
    parser.add_argument("--vtime-blue", type=int, default=999, help="青チームVタイム (秒、未達成時は999)")
    parser.add_argument("--winner-side", type=str, default="", help="勝利サイド ('red', 'blue', または自動)")
    parser.add_argument("--win-reason", type=str, default="", help="勝利理由 (例: 得点, Vゴール, 審判判定)")

    args = parser.parse_args()

    winner_side = args.winner_side
    if not winner_side:
        if args.score_red > args.score_blue:
            winner_side = "red"
        elif args.score_blue > args.score_red:
            winner_side = "blue"
        else:
            winner_side = "none"

    win_reason = args.win_reason
    if not win_reason:
        if args.vtime_red != 999 or args.vtime_blue != 999:
            win_reason = "Vゴール"
        elif args.score_red != args.score_blue:
            win_reason = "得点"
        else:
            win_reason = "同点"

    payload = {
        "match_id": args.match_id,
        "score_red": args.score_red,
        "score_blue": args.score_blue,
        "vtime_red": args.vtime_red,
        "vtime_blue": args.vtime_blue,
        "winner_side": winner_side,
        "win_reason": win_reason,
    }

    headers = {
        "Content-Type": "application/json",
    }
    if args.api_token:
        headers["API-TOKEN"] = args.api_token
        headers["API_TOKEN"] = args.api_token

    print("=== homepage matches API テストリクエスト ===")
    print(f"URL: {args.api_url}")
    print(f"Headers: {json.dumps({k: '***' if k == 'API_TOKEN' else v for k, v in headers.items()})}")
    print(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
    print("===========================================")

    try:
        response = httpx.post(args.api_url, json=payload, headers=headers, timeout=10.0)
        print(f"\nレスポンスステータス: {response.status_code}")
        try:
            res_json = response.json()
            print(f"レスポンスBody: {json.dumps(res_json, ensure_ascii=False, indent=2)}")
        except Exception:
            print(f"レスポンスBody (テキスト): {response.text}")

        if response.status_code == 200:
            print("\n✅ API送信成功！")
        else:
            print(f"\n❌ API送信失敗 (HTTP {response.status_code})")

    except Exception as e:
        print(f"\n❌ 接続エラーが発生しました: {e}")


if __name__ == "__main__":
    main()
