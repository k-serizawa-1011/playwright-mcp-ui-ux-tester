# UI違和感検知テスト

Playwright MCPを活用したUI違和感検知テストが含まれています。

## 🔒 セキュリティ注意事項

⚠️ **重要**: このツールを使用する際は以下の点に注意してください：

- `.env` ファイルには実際の認証情報を設定してください（このファイルはGitにコミットされません）
- テスト対象URLは公開されているサイトのみを使用してください
- 内部システムやステージング環境のURLを使用する場合は、適切な認証情報を設定してください
- 認証情報は絶対にコード内にハードコードしないでください

## 🎯 概要

設定された対象サイトに対して、AIが自動的にUIの視覚的問題を検出するテストスイートです。

### 🌟 主要機能

**🎯 UI違和感検知機能**

- 要素の重なり検出
- レイアウトシフト検出
- スペーシング問題検出
- フォントサイズ不整合検出
- スクリーンショットで問題箇所をハイライト

## 🔧 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

```bash
npx playwright install
```

### 2. 環境変数の設定

テストを実行する前に、環境変数ファイルを設定してください：

サンプルファイルをコピー

```bash
cp .env.example .env
```

環境変数ファイルを編集して認証情報を設定

```bash
# UI違和感検知テスト 環境変数設定
# Basic認証情報（必須）
EXPLORATION_BASIC_AUTH_USERNAME=your_username_here
EXPLORATION_BASIC_AUTH_PASSWORD=your_password_here

# テスト対象URL（必須）
EXPLORATION_TEST_TARGET_URL=https://www.google.com

# テスト設定（オプション）
EXPLORATION_TIMEOUT=30000
EXPLORATION_ACTION_TIMEOUT=30000
```

## 🚀 実行方法

### UI違和感検知テストの実行

```bash
npm run test:visual
```

または、特定のブラウザで実行：

```bash
npx playwright test --config=playwright-mcp.config.ts ./tests/exploration/ai-visual-issues.spec.ts --project=chromium
```

**特徴：**

- 視覚的問題のみに特化
- スクリーンショットで問題箇所をハイライト
- 高速実行（約3-4秒程度）
- 最も使用頻度の高い機能

## 📊 結果確認方法

### 🎯 UI違和感検知機能の使い方

UI違和感検知機能は、最も使用頻度の高い機能です。以下の手順で簡単に実行できます：

#### ステップ1: UI違和感検知テストを実行

UI違和感検知専用テストを実行

```bash
npm run test:visual
```

**実行時の出力例：**

```
✅ 環境変数設定を読み込みました:
  - 設定ファイル: /path/to/.env
  - 対象URL: https://www.google.com
  - ユーザー名: *********
  - パスワード: *************
  - タイムアウト: 30000ms
  - アクションタイムアウト: 30000ms

🔍 UI違和感検知テスト開始
📸 通常スクリーンショット保存: tests/exploration/outputs/screenshots/visual-issues-20250829135440001.png
🔍 検出された視覚的問題数: 628個
🔴 高優先度問題数: 599個
🎯 ハイライト対象問題数: 10個
🔴 要素をハイライトしました: 問題1
   📍 問題タイプ: visual
   📝 詳細: 要素の重なりが検出されました (100%)
   🎯 優先度: high
...
📸 ハイライトスクリーンショット保存: tests/exploration/outputs/screenshots/visual-issues-20250829135440001-highlighted.png
💾 結果を保存しました: tests/exploration/outputs/visual-issues-20250829135440001.json
✅ UI違和感検知テスト完了
```

#### ステップ2: 結果の詳細確認

テスト実行後、詳細な結果を確認

```bash
npm run show-results
```

**出力例：**

```
🔍 UI違和感検知結果を確認中...
📁 結果ディレクトリ: /path/to/tests/exploration/outputs

🎯 UI違和感検知結果サマリー
==================================================
📄 ページタイトル: Google
🔗 対象URL: https://www.google.com/?zx=1756442656971&no_sw_cr=1
⏰ 実行日時: 2025/8/29 13:44:18

📊 検出された問題数: 568個
🔴 高優先度問題: 505個
🟠 中優先度問題: 61個
🟢 低優先度問題: 2個

📸 スクリーンショット:
   1. tests/exploration/outputs/screenshots/visual-issues-20250829134416728.png
   2. tests/exploration/outputs/screenshots/visual-issues-20250829134416728-highlighted.png

🔍 問題の詳細:
   - 要素の重なり: 566個
   - レイアウトシフト: 0個
   - レイアウト問題: 0個
   - スペーシング問題: 2個
   - フォント問題: 0個

🎯 ハイライトされた問題 (スクリーンショットの番号付き):
--------------------------------------------------
🔢 問題1: 🟠 要素の重なりが検出されました (100%)
   📍 タイプ: visual
   🎯 優先度: high
   💡 提案: 要素の位置やz-indexを調整してください

💡 推奨アクション:
   1. 要素の重なり問題の修正 (566個)
      - 要素の位置やz-indexを調整
      - レイアウトの見直し
   3. スペーシングの統一性向上 (2個)
      - パディング/マージンの統一
```

#### ステップ3: スクリーンショットで視覚確認

テスト実行後、以下の2つのスクリーンショットが生成されます：

スクリーンショットの場所を確認

```bash
ls -la tests/exploration/outputs/screenshots/visual-issues-*.png
```

**生成されるファイル：**

- `visual-issues-{timestamp}.png` - 通常版（ハイライトなし）
- `visual-issues-{timestamp}-highlighted.png` - ハイライト版（問題箇所が赤く表示）

#### ステップ4: スクリーンショットを開いて確認

**macOSの場合：**

通常版を開く

```bash
open tests/exploration/outputs/screenshots/visual-issues-{timestamp}.png
```

ハイライト版を開く

```bash
open tests/exploration/outputs/screenshots/visual-issues-{timestamp}-highlighted.png
```

**Windowsの場合：**

通常版を開く

```bash
start tests/exploration/outputs/screenshots/visual-issues-{timestamp}.png
```

ハイライト版を開く

```bash
start tests/exploration/outputs/screenshots/visual-issues-{timestamp}-highlighted.png
```

#### ステップ5: 問題箇所の確認

**ハイライト版のスクリーンショットで確認できる内容：**

- 🔴 **赤い枠線**: 問題のある要素
- 🔴 **半透明の赤い背景**: 問題の範囲
- 🔢 **番号ラベル**: 1〜10の番号が付いた色分けされた円形ラベル
  - 1番: 赤、2番: オレンジ、3番: 黄色、4番: 緑、5番: 青
  - 6番: 紫、7番: ピンク、8番: シアン、9番: オレンジ、10番: バイオレット
- 📍 **位置分散**: 各番号ラベルは要素の異なる位置に配置（重なり防止）
- 📍 **複数の要素**: 最大10個の問題箇所が同時にハイライト
- 🎯 **優先度順**: 高優先度の問題から順番に番号が付与

**確認のポイント：**

1. **要素の重なり**: 要素が他の要素と重なっていないか
2. **レイアウト崩れ**: 要素が正しい位置に配置されているか
3. **スペーシング**: 要素間の間隔が適切か
4. **フォントサイズ**: 文字サイズが統一されているか

## 📁 プロジェクト構造

```
playwright-mcp-ui-ux-tester/
├── .env                                    # 環境変数ファイル
├── .env.example                           # 環境変数テンプレート
├── package.json                           # プロジェクト設定
├── tsconfig.json                          # TypeScript設定
├── playwright.config.ts                   # Playwrightベース設定
├── playwright-mcp.config.ts               # Playwright MCP設定
├── tests/
│   └── exploration/
│       ├── ai-visual-issues.spec.ts       # テストファイル
│       ├── ai-show-visual-results.js      # 結果表示スクリプト
│       ├── outputs/                       # 出力ディレクトリ
│       │   ├── screenshots/               # スクリーンショット
│       │   ├── test-results/              # Playwright標準出力
│       │   └── exploration-report/        # HTMLレポート
│       └── utils/
│           ├── ai-exploration-helper.ts   # ヘルパー関数
│           └── env-config.ts              # 環境設定
└── docs/                                  # ドキュメント
```

## 📊 最新の探索結果

### 🎯 UI違和感検知結果

- **対象URL**: https://www.google.com
- **実行日時**: 2025-08-29T13:54:40.001Z
- **検出された問題数**: 628個
- **認証**: Basic認証使用

### 問題の内訳

- **要素の重なり**: 566個
- **レイアウトシフト**: 0個
- **スペーシング問題**: 2個
- **フォント問題**: 0個

### 優先度別の問題数

- **高優先度**: 599個
- **中優先度**: 29個

### 📸 生成されるスクリーンショット

- **通常版**: `tests/exploration/outputs/screenshots/visual-issues-{timestamp}.png`
- **ハイライト版**: `tests/exploration/outputs/screenshots/visual-issues-{timestamp}-highlighted.png`

### UI違和感検知機能の成果

新しく追加されたUI違和感検知機能により、以下の問題を自動検出：

1. **要素の重なり検出**

   - 10%以上の重なりを検出
   - 50%以上の重なりは高優先度として分類

2. **レイアウトシフト検出**

   - CLS（Cumulative Layout Shift）の測定
   - 0.1以上のシフトを問題として検出

3. **表示崩れ検出**

   - コンテナからはみ出した要素の検出
   - overflow問題の特定

4. **パディング/マージンの違和感検出**

   - 20px以上の不整合を検出
   - 統一性の欠如を指摘

5. **フォントサイズの不整合検出**
   - 標準偏差8px以上のばらつきを検出
   - フォントサイズの統一性をチェック

### 推奨アクション

1. **最優先**: 要素の重なり問題の修正（566個）

   - 要素の位置やz-indexを調整
   - レイアウトの見直し

2. **高優先度**: レイアウトシフトの修正

   - 画像サイズの指定
   - 広告スペースの確保
   - 動的コンテンツの挿入位置を調整

3. **中優先度**: スペーシング問題の修正

   - パディング/マージンの統一
   - フォントサイズの統一

## 🛠️ トラブルシューティング

### よくある問題

1. **認証エラーが発生する**

   環境変数ファイルを確認

   ```bash
   cat .env
   ```

2. **テストが失敗する**

   ブラウザを再インストール

   ```bash
   npx playwright install
   ```

3. **スクリーンショットが保存されない**

   ディレクトリの権限を確認

   ```bash
   chmod 755 tests/exploration/outputs/screenshots
   ```

4. **環境変数が読み込まれない**

   設定ファイルのパスを確認

   ```bash
   ls -la .env
   ```

## 🚀 利用可能なコマンド

### npmスクリプト

```bash
# 基本的なテスト実行
npm test

# 探索テスト実行
npm run test:exploration

# UI違和感検知テスト実行
npm run test:visual

# 結果表示
npm run show-results

# ブラウザインストール
npm run install-browsers
```

### 直接実行

```bash
# 特定のブラウザでテスト実行
npx playwright test --config=playwright-mcp.config.ts ./tests/exploration/ai-visual-issues.spec.ts --project=chromium

# HTMLレポート表示
npx playwright show-report tests/exploration/outputs/exploration-report

# 結果表示スクリプト実行
node tests/exploration/ai-show-visual-results.js
```

## 📚 参考資料

- [Playwright Documentation](https://playwright.dev/)
- [Web Performance Best Practices](https://web.dev/performance/)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
