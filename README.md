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

**🚀 画面遷移テスト機能**

- クリック可能な要素の自動検出
- フォーム入力フィールドの自動検出
- 画面遷移の自動テスト実行
- 遷移成功/失敗の判定
- スクリーンショットによる遷移結果の記録
- 応答時間の測定

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

### 画面遷移テストの実行

```bash
npm run test:navigation
```

または、特定のブラウザで実行：

```bash
npx playwright test --config=playwright-mcp.config.ts ./tests/exploration/ai-navigation-test.spec.ts --project=chromium
```

**特徴：**

- クリック可能な要素の自動検出とテスト
- フォーム入力フィールドの自動テスト
- 画面遷移の成功/失敗を自動判定
- 遷移後のスクリーンショット自動撮影
- 応答時間の測定
- 最大10個の要素をテスト（パフォーマンス考慮）

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

### 🚀 画面遷移テスト結果の確認方法

#### ステップ1: 画面遷移テストを実行

```bash
npm run test:navigation
```

#### ステップ2: 結果の詳細確認

```bash
npm run show-navigation-results
```

**出力例：**

```
🔍 画面遷移テスト結果を確認中...

🎯 画面遷移テスト結果サマリー
==================================================
📄 ページタイトル: Google
🔗 対象URL: https://www.google.com
⏰ 実行日時: 2025/8/29 14:30:15
📁 結果ファイル: navigation-results-20250829143015.json

📊 検出された要素数:
🔗 クリック可能要素: 15個
📝 入力フィールド: 3個
🚀 実行されたテスト: 10個

📈 テスト結果:
✅ 成功: 8個
❌ 失敗: 2個
📊 成功率: 80%

✅ 成功した画面遷移:
--------------------------------------------------
1. INPUT: input[name="q"]
   📝 入力値: test search
   ⏱️  応答時間: 150ms

2. BUTTON: input[type="submit"]
   🔗 URL変更: https://www.google.com → https://www.google.com/search?q=test+search
   📄 タイトル変更: Google → test search - Google 検索
   ⏱️  応答時間: 1200ms
   📸 スクリーンショット: tests/exploration/outputs/screenshots/navigation-button-1735123456789.png

❌ 失敗した画面遷移:
--------------------------------------------------
1. LINK: a[href="#"]
   🚫 エラー: Element not found

📊 要素タイプ別分析:
--------------------------------------------------
INPUT:
   📊 総数: 3個
   ✅ 成功: 3個
   ❌ 失敗: 0個
   📈 成功率: 100%

BUTTON:
   📊 総数: 5個
   ✅ 成功: 4個
   ❌ 失敗: 1個
   📈 成功率: 80%

💡 推奨アクション:
--------------------------------------------------
1. 失敗した遷移の修正 (2個)
   - 要素のセレクターを確認
   - 要素が正しく表示されているか確認
   - JavaScriptエラーの確認

2. 成功した遷移の最適化 (8個)
   - 応答時間の改善
   - ユーザビリティの向上

3. 追加のテストケース検討
   - より多くの要素のテスト
   - エッジケースの追加
```

#### ステップ3: 遷移後のスクリーンショット確認

成功した画面遷移のスクリーンショットを確認

```bash
ls -la tests/exploration/outputs/screenshots/navigation-*.png
```

**生成されるファイル：**

- `navigation-test-{timestamp}-initial.png` - 初期画面
- `navigation-{elementType}-{timestamp}.png` - 各遷移後の画面

#### ステップ4: スクリーンショットを開いて確認

**macOSの場合：**

```bash
open tests/exploration/outputs/screenshots/navigation-*.png
```

**Windowsの場合：**

```bash
start tests/exploration/outputs/screenshots/navigation-*.png
```

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
│       ├── ai-visual-issues.spec.ts       # UI違和感検知テスト
│       ├── ai-navigation-test.spec.ts     # 画面遷移テスト
│       ├── ai-show-visual-results.js      # UI違和感検知結果表示
│       ├── ai-show-navigation-results.js  # 画面遷移結果表示
│       ├── outputs/                       # 出力ディレクトリ
│       │   ├── screenshots/               # スクリーンショット
│       │   ├── test-results/              # Playwright標準出力
│       │   └── exploration-report/        # HTMLレポート
│       └── utils/
│           ├── ai-exploration-helper.ts   # UI違和感検知ヘルパー
│           ├── ai-navigation-helper.ts    # 画面遷移テストヘルパー
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

### 画面遷移テスト機能の成果

新しく追加された画面遷移テスト機能により、以下の機能を自動テスト：

1. **クリック可能要素の自動検出**

   - ボタン、リンク、フォーム送信ボタンなどを自動検出
   - 表示状態と有効性を確認

2. **フォーム入力フィールドの自動検出**

   - テキスト入力、メール、パスワード、検索フィールドなどを検出
   - 入力タイプに応じた適切なテスト値を自動生成

3. **画面遷移の自動テスト**

   - 最大10個の要素を自動的にテスト
   - URL変更、タイトル変更による遷移成功判定
   - 応答時間の測定

4. **エラー検出とレポート**

   - 失敗した遷移の詳細なエラー情報
   - 要素タイプ別の成功率分析
   - 推奨アクションの提示

5. **スクリーンショットによる記録**
   - 各遷移後の画面を自動撮影
   - 視覚的な確認が可能

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

4. **画面遷移の最適化**

   - 失敗した遷移の修正
   - 応答時間の改善
   - ユーザビリティの向上

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

# 画面遷移テスト実行
npm run test:navigation

# UI違和感検知結果表示
npm run show-results

# 画面遷移結果表示
npm run show-navigation-results

# ブラウザインストール
npm run install-browsers
```

### 直接実行

```bash
# 特定のブラウザでテスト実行
npx playwright test --config=playwright-mcp.config.ts ./tests/exploration/ai-visual-issues.spec.ts --project=chromium

# 画面遷移テスト実行
npx playwright test --config=playwright-mcp.config.ts ./tests/exploration/ai-navigation-test.spec.ts --project=chromium

# HTMLレポート表示
npx playwright show-report tests/exploration/outputs/exploration-report

# 結果表示スクリプト実行
node tests/exploration/ai-show-visual-results.js

# 画面遷移結果表示スクリプト実行
node tests/exploration/ai-show-navigation-results.js
```

## 📚 参考資料

- [Playwright Documentation](https://playwright.dev/)
- [Web Performance Best Practices](https://web.dev/performance/)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
