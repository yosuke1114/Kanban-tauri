# リリースプロセス

## ベータリリース手順

### 1. 準備

```bash
# リリース準備スクリプト実行
./scripts/prepare-release.sh 0.1.0-beta.1
```

このスクリプトは以下を実行：
- バージョン番号更新（package.json, tauri.conf.json）
- 依存関係更新
- テスト実行
- ビルド確認

### 2. コミット・タグ

```bash
git add .
git commit -m "chore: release v0.1.0-beta.1"
git tag v0.1.0-beta.1
git push origin master --tags
```

### 3. GitHub Actionsで自動ビルド

タグをpushすると、`.github/workflows/release.yml`が自動実行されます：
- macOS用ビルド（.dmg, .app）
- Windows用ビルド（.msi, .exe）
- Linux用ビルド（.deb, .AppImage）

ビルド状況: https://github.com/yosuke1114/Kanban-tauri/actions

### 4. GitHub Releasesで配布

1. https://github.com/yosuke1114/Kanban-tauri/releases にアクセス
2. "Draft a new release"をクリック
3. 以下を入力：
   - **Tag**: v0.1.0-beta.1
   - **Title**: v0.1.0-beta.1 (Beta Release)
   - **Description**: CHANGELOG.mdから転記
4. ビルド成果物（Artifacts）を添付：
   - macOS: kanban-rust_0.1.0-beta.1_x64.dmg
   - Windows: kanban-rust_0.1.0-beta.1_x64.msi
   - Linux: kanban-rust_0.1.0-beta.1_amd64.deb
5. "This is a pre-release"にチェック
6. "Publish release"をクリック

### 5. ベータテスターに通知

配布内容：
- ダウンロードURL: https://github.com/yosuke1114/Kanban-tauri/releases/tag/v0.1.0-beta.1
- インストールガイド: README_BETA.md
- ユーザーガイド: USER_GUIDE.md
- フィードバック先: GitHub Issues

---

## 手動ビルド（トラブルシューティング）

GitHub Actionsが使えない場合、ローカルでビルド：

### macOS
```bash
npm run tauri build
# 成果物: src-tauri/target/release/bundle/dmg/
```

### Windows
```bash
npm run tauri build
# 成果物: src-tauri/target/release/bundle/msi/
```

### Linux
```bash
npm run tauri build
# 成果物: src-tauri/target/release/bundle/deb/
```

---

## ホットフィックスリリース

クリティカルバグ修正時：

```bash
# バグ修正
git add .
git commit -m "fix: critical bug"

# パッチバージョンアップ
./scripts/prepare-release.sh 0.1.0-beta.2

# リリース
git push origin master --tags
```

---

## チェックリスト

リリース前：
- [ ] 全テストパス（333テスト）
- [ ] ビルド成功
- [ ] ドキュメント更新（CHANGELOG.md）
- [ ] バージョン番号確認

リリース後：
- [ ] GitHub Releasesで公開
- [ ] ベータテスターに通知
- [ ] フィードバック収集準備
