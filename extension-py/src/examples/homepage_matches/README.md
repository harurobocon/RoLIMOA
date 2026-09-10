# RoLIMOA - homepage matches アプリ連携エクステンション

RoLIMOA で確定した試合結果（得点、Vゴールタイム、勝敗）を自動でホームページ（`homepage`）の `matches` アプリの API に送信・反映する Python 拡張機能です。

## 主な機能

- **試合結果自動送信**: 主審画面で試合結果が確定されたタイミング（`resultRecords/addResult`）を WebSocket で検知し、即座にホームページ側の API（`/staff/matches/api/update/`）へ HTTP POST します。
- **試合IDの自動抽出**: RoLIMOA 側の試合名（例: `MA-1`, `MK-7` など）から `M{英字1文字}-{数字}` を正規表現で抽出します。
- **勝敗・Vタイム判定**: スコアや Vゴールタイム（未達成時は `999`）をホームページの仕様に合わせて変換します。
- **二重送信防止**: 同一試合の確定結果が重複送信されるのを防ぎます。
- **ドライランモード**: 実際に API に送信せず、ペイロードのプレビュー確認が可能です。
- **スタンドアロン疎通テスト**: RoLIMOA を介さずに API への直接送信テストができる `test_client.py` を同梱。

---

## セットアップ

### 1. 環境変数の設定
本ディレクトリに `.env` ファイルを作成し、必要な設定を記述します。

```bash
cp .env.example .env
```

`.env` の内容例:
```env
# RoLIMOA WebSocket URL
ROLIMOA_WS_URL=ws://localhost:8000/ws

# homepage matches update API URL
HOMEPAGE_API_URL=http://localhost:8000/staff/matches/api/update/

# homepage matches API Token (Django側の GAS_API_TOKEN と同じ値)
HOMEPAGE_API_TOKEN=your_token_value
```

---

## 使い方

### 1. 拡張機能の起動（本番・連携実行）

```bash
cd extension-py/src/examples/homepage_matches
uv run main.py
```

引数で直接指定することも可能です:
```bash
uv run main.py --ws-url ws://localhost:8000/ws --api-url http://localhost:8000/staff/matches/api/update/ --api-token <TOKEN>
```

### 2. プレビュー確認（ドライラン）
API への実際の HTTP リクエストを行わずに、受信ペイロードと変換後のデータを確認します:
```bash
uv run main.py --dry-run
```

### 3. API 直接疎通テスト (`test_client.py`)
RoLIMOA を起動せずに、homepage の API への送信テストを行えます:
```bash
uv run test_client.py --api-url http://localhost:8000/staff/matches/api/update/ --api-token <TOKEN> --match-id MA-1 --score-red 50 --score-blue 30
```

### 4. 変換ロジックの単体テスト (`test_converter.py`)
```bash
uv run test_converter.py
```

---

## ホームページ側の API 仕様 (`update_match_result`)
- **エンドポイント**: `POST /staff/matches/api/update/`
- **リクエストヘッダー**:
  - `Content-Type: application/json`
  - `API_TOKEN: <HOMEPAGE_API_TOKEN>`
- **送信データ形式**:
```json
{
  "match_id": "MA-1",
  "score_red": 50,
  "score_blue": 30,
  "vtime_red": 999,
  "vtime_blue": 999,
  "winner_side": "red",
  "win_reason": "得点"
}
```
