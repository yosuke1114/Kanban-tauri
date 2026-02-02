# テストガイド

このドキュメントは、Kanban-Rustプロジェクトのテスト実装について説明します。

## テスト環境

- **テストフレームワーク**: Vitest
- **テストライブラリ**: @testing-library/react
- **DOM環境**: jsdom

## テストの実行

```bash
# 全テスト実行
npm test

# UIモードでテスト実行
npm run test:ui

# カバレッジ計測
npm run test:coverage

# 特定のテストファイルのみ実行
npm test -- <ファイル名>
```

## テスト構成

### 1. ユニットテスト

#### recurrenceService.test.ts (17テスト)
繰り返しタスクのロジックをテスト
- `calculateNextDueDate`: 各繰り返しタイプ（daily/weekly/monthly）の次回期限計算
- `isRecurrenceEnded`: 繰り返し終了判定
- `getRecurrenceDescription`: 日本語説明テキスト生成

#### useBoardStore.test.ts (19テスト)
Zustandストアの主要機能をテスト
- タスク操作: 追加、更新、削除、移動
- 列操作: デフォルト列の削除制限、カスタム列の削除
- メンバー/タグ操作: 削除時のタスクからの参照削除
- フィルター機能: 複合フィルター（タグ/担当者/優先度）

#### useFilteredTasks.test.ts (5テスト)
フィルターフックの動作をテスト
- タグ/担当者/優先度フィルターの個別動作
- 複合フィルター（AND条件）

#### notificationService.test.ts (12テスト)
通知サービスのロジックをテスト
- 通知権限の要求と確認
- 通知表示ロジック
- 期限切れ/期限間近タスクの通知

### 2. コンポーネントテスト

#### TaskCard.test.tsx (16テスト)
タスクカードの表示をテスト
- タイトル、説明、優先度バッジの表示
- 期限ステータス（期限切れ/今日/間近）の表示
- タグと担当者の表示

#### FilterPanel.test.tsx (13テスト)
フィルターパネルのUI操作をテスト
- タグ/担当者/優先度の選択/解除
- クリアボタンの動作
- アクティブフィルターのカウント表示

#### RecurrenceSettings.test.tsx (11テスト + 1スキップ)
繰り返し設定UIをテスト
- スイッチのオン/オフ動作
- 間隔と終了日の変更
- 繰り返しルールの説明表示
- ※ Radix UIのSelectコンポーネントはjsdom環境でのテストが困難なため、単位変更のテストはスキップ

## テスト統計

- **合計テストファイル数**: 7
- **合計テスト数**: 94（93 passed, 1 skipped）
- **カバレッジ対象**:
  - `src/services/` - 純粋関数、高カバレッジ目標（90%+）
  - `src/stores/` - ストアロジック（80%+）
  - `src/hooks/` - カスタムフック（80%+）
  - `src/components/` - コンポーネント（60%+）

## 注意事項

### Zustandストアのテスト

Zustandストアをテストする際は、`getState()`で取得した値は**スナップショット**であり、ストアの変更後は再度`getState()`を呼ぶ必要があります。

```typescript
// ❌ 誤り
const { addTask, tasks } = useBoardStore.getState();
addTask('todo', 'タスク');
expect(tasks).toHaveLength(1); // tasksは古いスナップショット

// ✅ 正しい
const { addTask } = useBoardStore.getState();
addTask('todo', 'タスク');
const tasks = useBoardStore.getState().tasks;
expect(Object.values(tasks)).toHaveLength(1);
```

### Radix UIコンポーネントのテスト制限

Radix UIのSelect、Popover等の複雑なコンポーネントは、jsdom環境では一部の機能が正しく動作しない場合があります。これらのテストは実際のブラウザ環境（E2Eテスト）で補完することを推奨します。

### localStorageのモック

テスト環境では`localStorage`がモックされています（`src/test/setup.ts`）。各テスト後に自動的にクリアされます。

## CI/CD

### GitHub Actions

プロジェクトには自動テストとビルドチェックのためのGitHub Actionsワークフローが設定されています。

**ワークフローファイル**: `.github/workflows/test.yml`

**トリガー条件**:
- `master`、`main`、`develop`ブランチへのpush
- これらのブランチへのPull Request

**実行内容**:
1. TypeScript型チェック (`tsc --noEmit`)
2. テスト実行 (`npm test`)
3. フロントエンドビルド (`npm run build`)
4. カバレッジレポートのアップロード

**Node.jsバージョン**: 20.x (LTS)

### ローカルでのカバレッジ確認

```bash
# カバレッジレポート生成
npm run test:coverage

# HTMLレポートを開く
open coverage/index.html
```

**カバレッジ設定** (`vitest.config.ts`):
- **対象**: `src/**/*.{ts,tsx}`
- **除外**: テストファイル、setup、shadcn/uiコンポーネント
- **レポート形式**: text、json、html

## 今後の拡張

Phase 4（未実装）:
- **E2Eテスト**: Playwright等を使用したブラウザテスト
- **D&Dテスト**: @dnd-kitのドラッグ&ドロップ操作のテスト
- **カバレッジバッジ**: README.mdにカバレッジバッジを追加

## 参考リソース

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Library公式ドキュメント](https://testing-library.com/docs/react-testing-library/intro/)
- [t-wadaスタイルのTDD](https://t-wada.hatenablog.jp/)
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
