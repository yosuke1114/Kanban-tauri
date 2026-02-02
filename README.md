# Kanban Board

[![Test](https://github.com/yosuke1114/Kanban-tauri/actions/workflows/test.yml/badge.svg)](https://github.com/yosuke1114/Kanban-tauri/actions/workflows/test.yml)
[![Release Build](https://github.com/yosuke1114/Kanban-tauri/actions/workflows/release.yml/badge.svg)](https://github.com/yosuke1114/Kanban-tauri/actions/workflows/release.yml)

Tauri + React + TypeScriptで構築された、ビジネスプロフェッショナル向けカンバンボードアプリケーション。

<p align="center">
  <strong>🚀 ローカルファースト • 🔒 プライバシー重視 • ⚡️ 高速 • 📱 レスポンシブ</strong>
</p>

---

## 📥 インストール

### エンドユーザー向け

最新リリース: [v0.1.0-beta.1](https://github.com/yosuke1114/Kanban-tauri/releases/tag/v0.1.0-beta.1)

#### macOS
```bash
# DMGをダウンロードしてインストール
```

#### Windows
```bash
# MSIをダウンロードしてインストール
```

詳細は[インストールガイド](docs/INSTALLATION.md)を参照してください。

### 開発者向け

```bash
# リポジトリをクローン
git clone https://github.com/yosuke1114/Kanban-tauri.git
cd kanban-rust

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run tauri dev

# ビルド
npm run tauri build
```

---

## ✨ 主な機能

### タスク管理
- ✅ ドラッグ&ドロップでタスク移動
- ✅ サブタスク（チェックリスト）with期限
- ✅ 優先度設定（低/中/高/緊急）
- ✅ 期限設定と期限通知
- ✅ メンバーアサイン
- ✅ タグ付け
- ✅ タスク複製・アーカイブ
- ✅ 繰り返しタスク（日次/週次/月次）

### ボード管理
- ✅ マルチボード（複数プロジェクト管理）
- ✅ カスタムカラム作成・編集・並べ替え
- ✅ カンバン/リスト/カレンダービュー切り替え

### データ管理
- ✅ ローカルストレージ（ブラウザ/ファイルシステム）
- ✅ エクスポート/インポート（JSON）
- ✅ 自動保存（デバウンス500ms）

### フィルター・検索
- ✅ タグ・担当者・優先度フィルター
- ✅ リアルタイム検索
- ✅ 複数フィルター同時適用

### UI/UX
- ✅ レスポンシブデザイン（モバイル/タブレット/デスクトップ）
- ✅ キーボードショートカット（⌘K、⌘Nなど）
- ✅ Slackスタイルテーマ

---

## ⌨️ キーボードショートカット

| ショートカット | 機能 |
|--------------|------|
| `⌘K` / `Ctrl+K` | 検索フォーカス |
| `⌘N` / `Ctrl+N` | 新規タスク作成 |
| `Esc` | ダイアログを閉じる |
| `⌘1` / `Ctrl+1` | カンバンビュー |
| `⌘2` / `Ctrl+2` | リストビュー |
| `⌘M` / `Ctrl+M` | メンバー管理 |
| `⌘T` / `Ctrl+T` | タグ管理 |
| `⌘L` / `Ctrl+L` | 列管理 |
| `⌘Shift+F` / `Ctrl+Shift+F` | フィルタークリア |
| `?` | ショートカット一覧表示 |

---

## 🏗 アーキテクチャ

### 技術スタック

**フロントエンド:**
- React 18 + TypeScript (strict mode)
- Zustand (状態管理)
- @dnd-kit (ドラッグ&ドロップ)
- shadcn/ui + Tailwind CSS
- React Hook Form + Zod（バリデーション）
- date-fns（日付処理）

**バックエンド:**
- Tauri v1 (Rust)
- ローカルファイルストレージ

**開発・テスト:**
- Vite (ビルドツール)
- Vitest (ユニットテスト、328テスト、カバレッジ67%+)
- Playwright (E2Eテスト)
- GitHub Actions (CI/CD)

### プロジェクト構造

```
src/
├── components/     # UIコンポーネント
│   ├── kanban/    # カンバンボード
│   ├── list/      # リストビュー
│   ├── calendar/  # カレンダービュー
│   ├── task/      # タスク関連
│   ├── shared/    # 共有コンポーネント
│   └── ui/        # shadcn/ui
├── stores/        # Zustand状態管理
├── hooks/         # カスタムフック
├── services/      # ビジネスロジック
├── constants/     # 定数
├── utils/         # ユーティリティ
└── types/         # TypeScript型定義
```

詳細は[アーキテクチャドキュメント](docs/ARCHITECTURE.md)を参照してください。

---

## 🧪 テスト

```bash
# ユニットテスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage

# E2Eテスト
npm run test:e2e

# 型チェック
tsc --noEmit
```

**現在のテスト状況:**
- ✅ 328ユニットテスト
- ✅ カバレッジ67%+
- ✅ CI/CD自動実行

詳細は[テストドキュメント](docs/TESTING.md)を参照してください。

---

## 🤝 コントリビューション

コントリビューションを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は[コントリビューションガイド](docs/CONTRIBUTING.md)を参照してください。

---

## 📚 ドキュメント

- [アーキテクチャ](docs/ARCHITECTURE.md)
- [テスト戦略](docs/TESTING.md)
- [リリースプロセス](docs/RELEASE_PROCESS.md)
- [ロードマップ](ROADMAP.md)
- [変更履歴](CHANGELOG.md)

---

## 🔒 プライバシー

- すべてのデータはローカルに保存されます
- ネットワーク通信は行いません
- トラッキング・分析ツールは使用していません

---

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

## 🙏 謝辞

このプロジェクトは以下のオープンソースライブラリを使用しています：

- [Tauri](https://tauri.app/)
- [React](https://react.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [@dnd-kit](https://dndkit.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 サポート

- バグ報告: [GitHub Issues](https://github.com/yosuke1114/Kanban-tauri/issues)
- 機能要望: [GitHub Issues](https://github.com/yosuke1114/Kanban-tauri/issues)
- ディスカッション: [GitHub Discussions](https://github.com/yosuke1114/Kanban-tauri/discussions)
