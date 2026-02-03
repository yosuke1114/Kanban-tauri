# マルチボードバグ修正 (2026-02-03)

## 修正概要

マルチボード機能のバグを修正しました。これにより、ボード切り替え後にビュー変更しても正しいボードが維持されるようになりました。

## バグの詳細

### 症状

1. メインボードからボード切り替え後に、ビュー切り替え（カンバン→リスト→カンバン）するとメインボードに戻る
2. タスク追加を別ボードで実施してもメインボードに追加される

### 根本原因

#### 原因1: `switchBoard`が状態を永続化しない

**問題コード:**
```typescript
// src/stores/useBoardStore.ts (修正前)
switchBoard: (boardId: string) => {
  const state = get();
  if (!state.boards[boardId]) return;
  set({ currentBoardId: boardId });
  set({
    filters: { tagIds: [], assigneeIds: [], priorities: [] },
    searchQuery: "",
  });
  // ❌ saveToStorage()が呼ばれていない
},
```

**影響:** ボードを切り替えてもlocalStorageに保存されないため、再読み込み時に元のボードに戻る。

#### 原因2: `KanbanBoard`がマウント時に`loadFromStorage`を呼び出す

**問題コード:**
```typescript
// src/components/kanban/KanbanBoard.tsx (修正前)
useEffect(() => {
  const initializeData = async () => {
    await loadFromStorage();  // ❌ ビュー切り替え毎に実行される
    generateRecurringTasks();
  };
  initializeData();
}, []);
```

**影響:** ビュー切り替え（カンバン→リスト→カンバン）でKanbanBoardが再マウントされ、`loadFromStorage()`が呼ばれる。原因1で`currentBoardId`が保存されていないため、前回保存時のボード（メインボード）に戻る。

## 修正内容

### Phase 1: ストアの修正

**ファイル:** `src/stores/useBoardStore.ts`

```typescript
switchBoard: (boardId: string) => {
  const state = get();
  if (!state.boards[boardId]) return;
  set({ currentBoardId: boardId });
  set({
    filters: { tagIds: [], assigneeIds: [], priorities: [] },
    searchQuery: "",
  });
  // ✅ ボード切り替えを永続化
  get().saveToStorage();
},
```

### Phase 2: 初期化ロジックの移動

#### 2.1 App.tsxに初期化処理を追加

**ファイル:** `src/App.tsx`

```typescript
// 初期化処理（アプリ起動時に1回だけ実行）
useEffect(() => {
  const initializeApp = async () => {
    await loadFromStorage();
    generateRecurringTasks();
  };
  initializeApp();
}, [loadFromStorage, generateRecurringTasks]);
```

#### 2.2 KanbanBoard.tsxから初期化処理を削除

**ファイル:** `src/components/kanban/KanbanBoard.tsx`

```typescript
// 初期化処理はApp.tsxに移動済み
// useEffectのloadFromStorage呼び出しを削除
```

未使用のインポートも削除:
```typescript
// 修正前: import React, { useCallback, useEffect, useState, useMemo } from "react";
// 修正後: import React, { useCallback, useState, useMemo } from "react";
```

### Phase 3: マルチボードテストの追加

#### 3.1 ストアテスト

**新規ファイル:** `src/stores/useBoardStore.multiboard.test.ts`

テストケース:
1. `switchBoard`が`currentBoardId`を正しく変更する
2. `switchBoard`後に`saveToStorage`が呼ばれる
3. ボード切り替え後に`addTask`が正しいボードにタスクを追加する
4. ボード切り替え後にフィルターがリセットされる
5. 存在しないボードIDでは状態が変わらない
6. ボード切り替え後に`updateTask`が現在のボードのタスクを更新する
7. ボード切り替え後に`deleteTask`が現在のボードのタスクを削除する

#### 3.2 テスト削除

**ファイル:** `src/components/kanban/KanbanBoard.test.tsx`

初期化処理がApp.tsxに移動したため、以下のテストを削除:
- `コンポーネントマウント時にloadFromStorageが呼ばれる`
- `データ読み込み後にgenerateRecurringTasksが呼ばれる`

## テスト結果

```bash
npm run test -- --run
# Test Files: 24 passed (24)
# Tests: 345 passed | 9 skipped (354)
```

すべてのテストが成功しました。

## 横展開確認

他のストアアクションで`saveToStorage()`漏れがないか確認済み:

| アクション | saveToStorage呼び出し | 状態 |
|-----------|---------------------|------|
| addTask | ✅ あり | OK |
| updateTask | ✅ あり | OK |
| deleteTask | ✅ あり | OK |
| moveTask | ✅ あり | OK |
| addColumn | ✅ あり | OK |
| deleteColumn | ✅ あり | OK |
| addBoard | ✅ あり | OK |
| deleteBoard | ✅ あり | OK |
| **switchBoard** | ✅ **追加済み** | **修正完了** |
| updateBoardName | ✅ あり | OK |

## 検証方法

### 手動検証

1. アプリ起動
2. 新しいボードを作成
3. 新しいボードに切り替え
4. ビューをリスト→カンバンに切り替え
5. **確認:** 新しいボードが維持されていること
6. タスクを追加
7. **確認:** 新しいボードにタスクが追加されること

### 自動検証

```bash
npm run build           # ビルド成功
npm run test -- --run   # 全テスト成功 (345テスト)
```

## 再発防止策

1. **テスト追加:** マルチボード機能のテストを必須化
2. **コードレビュー観点:** 状態変更アクションには`saveToStorage()`が必要かチェック
3. **初期化ロジック:** コンポーネントではなくApp.tsxで一度だけ実行する原則
4. **ドキュメント更新:** CLAUDE.mdに初期化パターンとマルチボード修正を記載

## 修正ファイル一覧

### 変更ファイル

- `src/stores/useBoardStore.ts` - `switchBoard`に`saveToStorage()`追加
- `src/App.tsx` - 初期化処理を追加
- `src/components/kanban/KanbanBoard.tsx` - 初期化処理削除、未使用インポート削除
- `src/components/kanban/KanbanBoard.test.tsx` - 不要なテスト削除
- `CLAUDE.md` - 初期化パターンとマルチボード修正を記載

### 新規ファイル

- `src/stores/useBoardStore.multiboard.test.ts` - マルチボードストアテスト
- `docs/fixes/2026-02-03-multiboard-bug-fix.md` - この修正ドキュメント

## 影響範囲

### ポジティブな影響

- マルチボードが正しく動作するようになった
- ビュー切り替えでボードが変わらなくなった
- タスク追加が正しいボードに行われるようになった
- 初期化処理が一度だけ実行されるようになり、パフォーマンスが向上

### ネガティブな影響

- なし（既存テストはすべてパス）

## 参考情報

- Issue: マルチボードバグ修正計画 (実装済み)
- コミット: fix: マルチボードの状態永続化とビュー切り替えバグを修正
