# インストールガイド

このガイドでは、Kanban Board アプリケーションのインストール方法を説明します。

## エンドユーザー向けインストール

### システム要件

#### macOS
- macOS 10.15 (Catalina) 以降
- Apple Silicon (M1/M2) または Intel プロセッサ
- 空きディスク容量: 100MB以上

#### Windows
- Windows 10 (1903以降) または Windows 11
- x64 プロセッサ
- 空きディスク容量: 100MB以上

### 最新リリースのダウンロード

最新版は GitHub Releases からダウンロードできます:

**最新バージョン**: [v0.1.0-beta.3](https://github.com/yosuke1114/Kanban-tauri/releases/tag/v0.1.0-beta.3)

### macOS へのインストール

1. **DMG ファイルのダウンロード**
   - リリースページから `Kanban-Board_x.x.x_universal.dmg` をダウンロード
   - Apple Silicon と Intel の両方に対応しています

2. **インストール**
   ```bash
   # DMGファイルをダブルクリックしてマウント
   # アプリケーションを Applications フォルダにドラッグ&ドロップ
   ```

3. **初回起動時の設定**
   - macOS Gatekeeper により警告が表示される場合があります
   - 「システム環境設定」→「セキュリティとプライバシー」→「一般」タブ
   - 「このまま開く」ボタンをクリック

4. **アプリケーションの起動**
   ```bash
   # Applications フォルダから Kanban Board を起動
   ```

### Windows へのインストール

1. **MSI インストーラーのダウンロード**
   - リリースページから `Kanban-Board_x.x.x_x64_en-US.msi` をダウンロード

2. **インストール**
   ```bash
   # MSIファイルをダブルクリック
   # インストールウィザードに従ってインストール
   ```

3. **Windows Defender SmartScreen の警告について**
   - 「詳細情報」をクリック
   - 「実行」ボタンをクリック

4. **アプリケーションの起動**
   - スタートメニューから Kanban Board を起動

## Web版（ブラウザ）

デスクトップアプリをインストールせずにブラウザで使用することもできます。

### 対応ブラウザ
- Google Chrome 90+
- Firefox 88+
- Safari 14+
- Microsoft Edge 90+

### アクセス方法
```bash
# 開発サーバーを起動（開発者向け）
git clone https://github.com/yosuke1114/Kanban-tauri.git
cd kanban-rust
npm install
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

**注意**: Web版ではファイルシステムへの保存機能が制限されます。ブラウザの localStorage にデータが保存されます。

## 開発者向けセットアップ

### 必要な環境

#### すべてのプラットフォーム
- Node.js 18.x 以降
- npm 9.x 以降

#### macOS
```bash
# Xcode Command Line Tools
xcode-select --install

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Windows
```bash
# Visual Studio Build Tools
# https://visualstudio.microsoft.com/downloads/

# Rust
# https://rustup.rs/ からインストーラーをダウンロード
```

### リポジトリのクローン

```bash
git clone https://github.com/yosuke1114/Kanban-tauri.git
cd kanban-rust
```

### 依存関係のインストール

```bash
# Node.js 依存関係
npm install

# Rust 依存関係（Tauri CLI）
npm install -g @tauri-apps/cli
```

### 開発サーバーの起動

```bash
# Tauri アプリとして起動（推奨）
npm run tauri dev

# Vite 開発サーバーのみ起動（Web版）
npm run dev
```

### ビルド

```bash
# プロダクションビルド
npm run build

# デスクトップアプリのビルド
npm run tauri build
```

ビルド成果物は `src-tauri/target/release` に出力されます。

## トラブルシューティング

### macOS: "開発元を確認できません" エラー

**原因**: 署名されていないアプリケーションを開こうとしています。

**解決方法**:
```bash
# 1. システム環境設定 → セキュリティとプライバシー
# 2. 「一般」タブで「このまま開く」をクリック

# または、ターミナルから実行:
xattr -cr /Applications/Kanban\ Board.app
```

### Windows: SmartScreen 警告

**原因**: Microsoft による認証を受けていないアプリケーションです。

**解決方法**:
1. 「詳細情報」をクリック
2. 「実行」ボタンをクリック

### ビルドエラー: Rust コンパイルエラー

**解決方法**:
```bash
# Rust ツールチェインの更新
rustup update

# Tauri CLI の再インストール
npm uninstall -g @tauri-apps/cli
npm install -g @tauri-apps/cli
```

### データが消えた

**原因**: ブラウザの localStorage がクリアされた、またはアプリケーションデータが削除された。

**解決方法**:
- バックアップから復元（エクスポート機能で定期的にバックアップを推奨）
- デスクトップアプリではファイルシステムに保存されるため、データ損失リスクが低減されます

### 起動時に白い画面が表示される

**原因**: JavaScript エラーまたはデータの破損。

**解決方法**:
```bash
# ブラウザ版の場合
# 1. ブラウザの開発者ツールを開く（F12）
# 2. Console タブでエラーを確認
# 3. localStorage をクリア

# デスクトップアプリの場合
# アプリケーションデータをリセット
# macOS: ~/Library/Application Support/com.kanban.app
# Windows: %APPDATA%\com.kanban.app
```

## アンインストール

### macOS
```bash
# Applications フォルダから Kanban Board を削除
rm -rf /Applications/Kanban\ Board.app

# アプリケーションデータの削除（オプション）
rm -rf ~/Library/Application\ Support/com.kanban.app
```

### Windows
```bash
# コントロールパネル → プログラムのアンインストール
# Kanban Board を選択してアンインストール

# アプリケーションデータの削除（オプション）
# %APPDATA%\com.kanban.app フォルダを削除
```

## サポート

インストールに関する問題がある場合:

- [GitHub Issues](https://github.com/yosuke1114/Kanban-tauri/issues) でバグ報告
- [GitHub Discussions](https://github.com/yosuke1114/Kanban-tauri/discussions) で質問
