import argparse
import asyncio
from datetime import datetime
import os
from pathlib import Path
from typing import Any, Dict, Set

from dotenv import load_dotenv
from rolimoa_extension import RoLIMOAExtension
import tweepy

from tweet_formatter import format_tweet

# .env の読み込み (同階層の .env を優先)
ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

REQUIRED_VARIABLES = (
    "X_API_KEY",
    "X_API_KEY_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
)

# CLI 引数
parser = argparse.ArgumentParser(description="RoLIMOA 試合結果 X (Twitter) 自動投稿拡張")
parser.add_argument(
    "--ws-url",
    type=str,
    default=os.environ.get("RoLIMOA_WS_URL", "ws://localhost:8000/ws"),
    help="RoLIMOA サーバーの WebSocket URL (デフォルト: ws://localhost:8000/ws)",
)
parser.add_argument(
    "--dry-run",
    action="store_true",
    help="実際に投稿せず、ツイート文面のプレビューのみを出力する",
)
parser.add_argument(
    "--hashtags",
    type=str,
    default=os.environ.get("X_HASHTAGS", "#関東夏ロボコン #夏ロボコン"),
    help="投稿に付加するハッシュタグ (環境変数 X_HASHTAGS でも指定可)",
)
args = parser.parse_args()

# API認証設定の確認
missing_variables = [
    name for name in REQUIRED_VARIABLES if not os.environ.get(name)
]

if missing_variables and not args.dry_run:
    print("警告: 以下の環境変数が未設定です:", ", ".join(missing_variables))
    print("Xへの実投稿を行うには、.env に認証情報を設定してください。")
    print("プレビュー確認は --dry-run オプションで使用できます。")

print("=== RoLIMOA Twitter 拡張 ===")
print(f"- WebSocket URL: {args.ws_url}")
print(f"- ハッシュタグ: {args.hashtags}")
print(f"- 動作モード: {'[DRY RUN (投稿なし)]' if args.dry_run else '[LIVE (Xへ投稿)]'}")
print("===========================")

# 重複投稿防止用の記録
posted_match_keys: Set[str] = set()

roliex = RoLIMOAExtension(args.ws_url, device_name="extension/twitter")


@roliex.on_dispatch("resultRecords/addResult")
async def on_add_result(payload: Dict[str, Any]):
    match_data = payload.get("match") or {}
    match_name = match_data.get("name") or "未定"
    confirmed_at = payload.get("confirmedAt") or ""
    match_key = f"{match_name}_{confirmed_at}"

    print(f"\n[{datetime.now():%Y-%m-%d %H:%M:%S}] 試合結果確定を受信: {match_name}")

    # 主審が「Xに投稿する」のチェックを外していた場合
    if payload.get("postTweet") is False:
        print(f"ℹ️ 主審により「Xへの投稿」が無効化されているためスキップします: {match_name}")
        return

    # 重複防止
    if match_key in posted_match_keys:
        print(f"⚠️ 既に投稿済みの試合結果です: {match_name}")
        return

    # ツイート本文生成
    tweet_text = format_tweet(payload, default_hashtags=args.hashtags)
    print("\n--- [投稿予定ツイート] ---")
    print(tweet_text)
    print(f"文字数: {len(tweet_text)}")
    print("-------------------------\n")

    if args.dry_run:
        print("[DRY RUN] 投稿をスキップしました")
        posted_match_keys.add(match_key)
        return

    if missing_variables:
        print("❌ 認証情報が未設定のため投稿できませんでした:", ", ".join(missing_variables))
        return

    try:
        client = tweepy.Client(
            consumer_key=os.environ["X_API_KEY"],
            consumer_secret=os.environ["X_API_KEY_SECRET"],
            access_token=os.environ["X_ACCESS_TOKEN"],
            access_token_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
        )

        response = client.create_tweet(text=tweet_text, user_auth=True)
        post_id = response.data["id"]
        posted_match_keys.add(match_key)

        print(f"✅ Xへの投稿に成功しました！")
        print(f"🔗 https://x.com/i/status/{post_id}")

    except Exception as e:
        print(f"❌ Xへの投稿中にエラーが発生しました: {e}")


async def main():
    await roliex.connect()


if __name__ == "__main__":
    asyncio.run(main())
