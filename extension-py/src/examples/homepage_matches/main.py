import argparse
import asyncio
from datetime import datetime
import json
import os
from pathlib import Path
from typing import Any, Dict, Set

from dotenv import load_dotenv
import httpx
from rolimoa_extension import RoLIMOAExtension

from match_converter import convert_payload_to_match_update

# .env の読み込み (同階層の .env を優先)
ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

# CLI 引数設定
parser = argparse.ArgumentParser(description="RoLIMOA - HP matches アプリ試合結果自動連携拡張")
parser.add_argument(
    "--ws-url",
    type=str,
    default=os.environ.get("ROLIMOA_WS_URL", "ws://localhost:8000/ws"),
    help="RoLIMOA サーバーの WebSocket URL (デフォルト: ws://localhost:8000/ws)",
)
parser.add_argument(
    "--api-url",
    type=str,
    default=os.environ.get(
        "HOMEPAGE_API_URL", "http://localhost:8000/staff/matches/api/update/"
    ),
    help="homepage matches update API の URL (デフォルト: http://localhost:8000/staff/matches/api/update/)",
)
parser.add_argument(
    "--api-token",
    type=str,
    default=os.environ.get("HOMEPAGE_API_TOKEN") or os.environ.get("GAS_API_TOKEN") or "",
    help="homepage matches API認証トークン (環境変数 HOMEPAGE_API_TOKEN または GAS_API_TOKEN でも設定可)",
)
parser.add_argument(
    "--dry-run",
    action="store_true",
    help="実際にAPI送信を行わず、送信予定ペイロードのプレビューのみを出力する",
)

args = parser.parse_args()

# 設定確認ログ
print("=== RoLIMOA HP matches 連携拡張 ===")
print(f"- WebSocket URL: {args.ws_url}")
print(f"- API URL: {args.api_url}")
print(f"- APIトークン設定: {'[設定済み]' if args.api_token else '[未設定 (警告)]'}")
print(f"- 動作モード: {'[DRY RUN (送信なし)]' if args.dry_run else '[LIVE (API送信)]'}")
print("===================================")

if not args.api_token and not args.dry_run:
    print("⚠️ 警告: APIトークンが設定されていません。")
    print("  homepage側の token_required で 401 Unauthorized になる可能性があります。")
    print("  .env に HOMEPAGE_API_TOKEN=<token> を設定するか、--api-token 引数を指定してください。")
    print()

# 重複送信防止
sent_match_keys: Set[str] = set()

roliex = RoLIMOAExtension(args.ws_url, device_name="extension/homepage_matches")


@roliex.on_dispatch("resultRecords/addResult")
async def on_add_result(payload: Dict[str, Any]):
    match_info = payload.get("match") or {}
    match_name = match_info.get("name") or "未設定"
    confirmed_at = payload.get("confirmedAt") or ""

    print(f"\n[{datetime.now():%Y-%m-%d %H:%M:%S}] 試合結果確定を受信: {match_name}")

    try:
        match_data = convert_payload_to_match_update(payload)
    except ValueError as e:
        print(f"❌ ペイロード変換エラー: {e}")
        return

    match_id = match_data["match_id"]
    match_key = f"{match_id}_{confirmed_at}"

    # 重複送信チェック
    if match_key in sent_match_keys:
        print(f"⚠️ 既に送信済みの試合結果です: {match_id} (confirmedAt={confirmed_at})")
        return

    print("\n--- [homepage API 送信ペイロード] ---")
    print(json.dumps(match_data, ensure_ascii=False, indent=2))
    print("------------------------------------\n")

    if args.dry_run:
        print(f"[DRY RUN] 試合 {match_id} のAPI送信をスキップしました")
        sent_match_keys.add(match_key)
        return

    headers = {
        "Content-Type": "application/json",
    }
    if args.api_token:
        headers["API_TOKEN"] = args.api_token

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                args.api_url,
                json=match_data,
                headers=headers,
            )

            print(f"HTTP ステータスコード: {response.status_code}")
            try:
                res_json = response.json()
                print(f"レスポンス内容: {json.dumps(res_json, ensure_ascii=False)}")
            except Exception:
                print(f"レスポンス内容 (text): {response.text}")

            if response.status_code == 200:
                print(f"✅ homepage matches アプリへ試合結果 ({match_id}) を正常に反映しました！")
                sent_match_keys.add(match_key)
            else:
                print(f"❌ homepage matches API がエラーを返しました: HTTP {response.status_code}")

    except Exception as e:
        print(f"❌ homepage API への送信中に例外が発生しました: {e}")


async def main():
    await roliex.connect()


if __name__ == "__main__":
    asyncio.run(main())
