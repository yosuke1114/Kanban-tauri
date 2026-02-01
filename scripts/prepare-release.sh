#!/bin/bash
# ベータリリース準備スクリプト

set -e  # エラーで停止

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ エラー: バージョン番号を指定してください"
  echo "使用方法: ./scripts/prepare-release.sh <version>"
  echo "例: ./scripts/prepare-release.sh 0.1.0-beta.1"
  exit 1
fi

echo "🚀 リリース準備開始: v$VERSION"
echo ""

# 1. バージョン更新
echo "📝 バージョン番号を更新中..."
npm version $VERSION --no-git-tag-version

# 2. Cargo依存関係更新
echo "📦 Rust依存関係を更新中..."
cd src-tauri
cargo update
cd ..

# 3. テスト実行
echo "🧪 テストを実行中..."
npm run test -- --run

if [ $? -ne 0 ]; then
  echo "❌ テスト失敗: リリースを中止します"
  exit 1
fi

# 4. ビルド確認
echo "🏗️  ビルドを確認中..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ ビルド失敗: リリースを中止します"
  exit 1
fi

echo ""
echo "✅ リリース準備完了: v$VERSION"
echo ""
echo "次のコマンドでリリースを実行してください:"
echo ""
echo "  git add ."
echo "  git commit -m \"chore: release v$VERSION\""
echo "  git tag v$VERSION"
echo "  git push origin master --tags"
echo ""
