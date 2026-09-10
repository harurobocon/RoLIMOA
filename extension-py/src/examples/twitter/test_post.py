import argparse
import os
from datetime import datetime
from pathlib import Path

import tweepy
from dotenv import load_dotenv


env_file = Path(__file__).parent / ".env"
if env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv("./.env")

REQUIRED_VARIABLES = (
    "X_API_KEY",
    "X_API_KEY_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
)

missing_variables = [
    name for name in REQUIRED_VARIABLES if not os.environ.get(name)
]

if missing_variables:
    raise RuntimeError(
        "未設定の環境変数があります: " + ", ".join(missing_variables)
    )

parser = argparse.ArgumentParser()
parser.add_argument(
    "--send",
    action="store_true",
    help="実際にXへ投稿する",
)
args = parser.parse_args()

post_text = (
    "【RoLIMOA APIテスト】\n"
    "試合結果の自動投稿機能を確認しています。\n"
    f"実行日時: {datetime.now():%Y-%m-%d %H:%M:%S}"
)

print("投稿予定の文面:")
print("---")
print(post_text)
print("---")

if not args.send:
    print("プレビューのみです。投稿する場合は --send を付けてください。")
    raise SystemExit(0)

client = tweepy.Client(
    consumer_key=os.environ["X_API_KEY"],
    consumer_secret=os.environ["X_API_KEY_SECRET"],
    access_token=os.environ["X_ACCESS_TOKEN"],
    access_token_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
)

response = client.create_tweet(text=post_text, user_auth=True)
post_id = response.data["id"]

print("投稿に成功しました")
print(f"https://x.com/i/status/{post_id}")