# RoLIMOA Twitter (X) 自動投稿拡張

RoLIMOAで試合結果が確定した際、自動的にX (Twitter) へ試合結果を投稿する拡張スクリプトです。

## 概要

- 主審ページ（`/referee`）で「試合結果を確定」したイベント（`resultRecords/addResult`）をWebSocket経由で受信します。
- 試合名、対戦校・チーム名、得点（通常スコアまたはVゴール達成タイム）、勝者、主審が入力した試合コメント、ハッシュタグを整形してXに自動投稿します。
- 主審ページ側で「X (Twitter) に投稿する」のチェックを外した場合は、自動的にスキップされます。
- 同一試合の重複投稿防止機能を備えています。

## 投稿文面例

```
予選第3試合
国際信州大「触手もぐもぐ」VS 国際信州大「白米ぬるぬる」
0 - Vゴール 10秒
で白米ぬるぬるの勝利です！
すごい
#関東夏ロボコン #夏ロボコン
```

## セットアップ

### 1. APIキーの設定
`extension-py/src/examples/twitter/.env` を作成し、X Developer Portalで取得したAPIキーを設定します。（`.gitignore` に含まれます）

```env
X_API_KEY=your_api_key
X_API_KEY_SECRET=your_api_key_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
X_HASHTAGS=#関東夏ロボコン #夏ロボコン
```

### 2. 実行

#### プレビューモード（dry-run）
実際にXへ投稿せず、コンソールに生成されたツイート文面を出力します。

```bash
cd extension-py
uv run ./src/examples/twitter/main.py --dry-run
```

#### 本番投稿モード
試合結果確定時に実際にXへ自動投稿します。

```bash
cd extension-py
uv run ./src/examples/twitter/main.py
```

### コマンドライン引数
- `--ws-url`: RoLIMOAサーバーのWebSocket URL（デフォルト: `ws://localhost:8000/ws`）
- `--dry-run`: Xへの実投稿を行わずプレビューのみ実行
- `--hashtags`: 投稿に付与するハッシュタグ（デフォルト: `#関東夏ロボコン #夏ロボコン`、環境変数 `X_HASHTAGS` でも設定可）
