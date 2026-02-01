# テストカバレッジ分析

**分析日**: 2026-02-01
**総合カバレッジ**: 26.12%

---

## 📊 カバレッジサマリー

| メトリック | カバレッジ | 目標 | 状態 |
|-----------|----------|------|------|
| Statements | 26.12% | 75% | 🔴 不足 |
| Branches | 25.04% | 75% | 🔴 不足 |
| Functions | 24.93% | 75% | 🔴 不足 |
| Lines | 26.24% | 75% | 🔴 不足 |

---

## 🔴 カバレッジ0%のコンポーネント（優先対応）

### 1. KanbanBoard.tsx（0% カバレッジ）
**重要度**: 🔴 最高（コアコンポーネント）

**未テスト機能**:
- ドラッグ&ドロップ機能
- モバイルレスポンシブ（カラムセレクター、スワイプ）
- DragOverlay表示
- 初期データ読み込み（loadFromStorage, generateRecurringTasks）

**推奨テスト**:
```typescript
// src/components/kanban/KanbanBoard.test.tsx
describe('KanbanBoard', () => {
  it('列が正しく表示される', () => {});
  it('タスクをドラッグ&ドロップできる', () => {});
  it('モバイルでカラムセレクターが表示される', () => {});
  it('スワイプでカラム切り替えができる', () => {});
  it('初期データが読み込まれる', () => {});
});
```

**見積もり**: 5-6時間

---

### 2. ColumnManager.tsx（0% カバレッジ）
**重要度**: 🔴 高（Phase 3.0.1で実装）

**未テスト機能**:
- 列の追加
- 列の削除（バリデーション含む）
- 列の並べ替え（@dnd-kit）
- エラーダイアログ表示

**推奨テスト**:
```typescript
// src/components/kanban/ColumnManager.test.tsx
describe('ColumnManager', () => {
  it('新しい列を追加できる', () => {});
  it('列にタスクがある場合は削除できない', () => {});
  it('最後の列は削除できない', () => {});
  it('列をドラッグ&ドロップで並べ替えられる', () => {});
  it('削除確認ダイアログが表示される', () => {});
  it('エラーダイアログが表示される', () => {});
});
```

**見積もり**: 4-5時間

---

### 3. AppHeader.tsx（0% カバレッジ）
**重要度**: 🟡 中（UIコンポーネント）

**未テスト機能**:
- タスク追加フォーム
- 検索バー連携
- ユーザー選択
- 「自分のタスク」トグル
- 管理ダイアログボタン

**推奨テスト**:
```typescript
// src/components/layout/AppHeader.test.tsx
describe('AppHeader', () => {
  it('タスク追加フォームで新しいタスクを追加できる', () => {});
  it('ユーザーを選択できる', () => {});
  it('「自分のタスク」トグルが動作する', () => {});
  it('ユーザー未選択時は「自分のタスク」ボタンが無効', () => {});
  it('管理ダイアログが開く', () => {});
});
```

**見積もり**: 3-4時間

---

### 4. ListView.tsx（0% カバレッジ）
**重要度**: 🟡 中（代替ビュー）

**未テスト機能**:
- リスト表示
- タスク編集ダイアログ
- ステータス変更
- 優先度変更
- ソート機能

**推奨テスト**:
```typescript
// src/components/list/ListView.test.tsx
describe('ListView', () => {
  it('タスクがリスト形式で表示される', () => {});
  it('ステータスを変更できる', () => {});
  it('優先度を変更できる', () => {});
  it('タスクをクリックで編集ダイアログが開く', () => {});
});
```

**見積もり**: 3時間

---

### 5. useMediaQuery.ts（0% カバレッジ）
**重要度**: 🟡 中（レスポンシブ対応）

**未テスト機能**:
- メディアクエリの監視
- ビューポートサイズ判定

**推奨テスト**:
```typescript
// src/hooks/useMediaQuery.test.ts
describe('useMediaQuery', () => {
  it('メディアクエリにマッチする', () => {});
  it('メディアクエリが変更されると更新される', () => {});
});

describe('useViewportSize', () => {
  it('モバイルサイズを判定できる', () => {});
  it('タブレットサイズを判定できる', () => {});
  it('デスクトップサイズを判定できる', () => {});
});
```

**見積もり**: 2時間

---

### 6. useSwipe.ts（0% カバレッジ）
**重要度**: 🟢 低（モバイル限定機能）

**未テスト機能**:
- スワイプ検出
- 左右スワイプ判定

**推奨テスト**:
```typescript
// src/hooks/useSwipe.test.ts
describe('useSwipe', () => {
  it('左スワイプを検出する', () => {});
  it('右スワイプを検出する', () => {});
  it('閾値未満のスワイプは無視する', () => {});
  it('垂直スワイプは無視する（スクロール優先）', () => {});
});
```

**見積もり**: 2時間

---

### 7. その他（0% カバレッジ）

- **ShortcutsDialog.tsx**: キーボードショートカット一覧表示（優先度低）
- **MemberManager.tsx**: メンバー管理ダイアログ（優先度中）
- **TagManager.tsx**: タグ管理ダイアログ（優先度中）
- **EditTaskDialog.tsx**: タスク編集ダイアログ（優先度高）
- **SearchBar.tsx**: 検索バー（優先度低）

---

## 🟢 良好なカバレッジ

### 1. TaskCard.tsx（93.75% カバレッジ）
✅ ほぼ完全にテストされている

### 2. FilterPanel.tsx（94.44% カバレッジ）
✅ ほぼ完全にテストされている

### 3. RecurrenceSettings.tsx（87.5% カバレッジ）
✅ 主要機能がテストされている

### 4. notificationService.ts（100% カバレッジ）
✅ 完全にテストされている

### 5. recurrenceService.ts（93.75% カバレッジ）
✅ ほぼ完全にテストされている

---

## 🟡 中程度のカバレッジ

### 1. useBoardStore.ts（63.09% カバレッジ）
**未カバー範囲**: Line 189-210, 429-532, 548

**推奨追加テスト**:
- フィルター機能のテスト
- SharePoint連携機能のテスト（未実装のため後回しでOK）
- エッジケースのテスト

**見積もり**: 3時間

---

### 2. useFilteredTasks.ts（70.58% カバレッジ）
**未カバー範囲**: Line 13-18, 44-47

**推奨追加テスト**:
- 期限範囲フィルターのテスト
- 複数フィルター同時適用のエッジケース

**見積もり**: 1時間

---

## 📋 テスト実装優先順位

### Phase 1: コアコンポーネント（必須）
1. **KanbanBoard.test.tsx**（5-6時間）- 最重要
2. **ColumnManager.test.tsx**（4-5時間）- Phase 3.0.1の検証
3. **EditTaskDialog.test.tsx**（4時間）- タスク編集の検証

**合計**: 13-15時間

### Phase 2: UI層（推奨）
4. **AppHeader.test.tsx**（3-4時間）
5. **ListView.test.tsx**（3時間）
6. **MemberManager.test.tsx**（2時間）
7. **TagManager.test.tsx**（2時間）

**合計**: 10-11時間

### Phase 3: フック・サービス層（推奨）
8. **useMediaQuery.test.ts**（2時間）
9. **useSwipe.test.ts**（2時間）
10. **useBoardStore.ts 追加テスト**（3時間）

**合計**: 7時間

### Phase 4: その他（オプション）
11. **SearchBar.test.tsx**（1時間）
12. **ShortcutsDialog.test.tsx**（1時間）

**合計**: 2時間

---

## 🎯 目標設定

### 短期目標（今週）
- Phase 1完了（コアコンポーネント）
- **目標カバレッジ**: 50%以上

### 中期目標（来週）
- Phase 2完了（UI層）
- **目標カバレッジ**: 65%以上

### 長期目標（今月）
- Phase 3完了（フック・サービス層）
- **目標カバレッジ**: 75%以上（CLAUDE.md目標）

---

## 🧪 テスト実装ガイドライン

### Vitestの推奨パターン

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  beforeEach(() => {
    // テストごとにストアをリセット
    useBoardStore.setState(initialState);
  });

  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });
});
```

### Zustandストアのテスト

```typescript
import { renderHook, act } from '@testing-library/react';

describe('useBoardStore', () => {
  it('should update state correctly', () => {
    const { result } = renderHook(() => useBoardStore());

    act(() => {
      result.current.addTask('todo', 'New Task');
    });

    expect(Object.keys(result.current.tasks)).toHaveLength(1);
  });
});
```

---

## 📊 現状の課題

### 1. E2Eテスト不足
- Playwrightのセットアップはあるが、テストケースがない
- ユーザーシナリオベースのテストが必要

### 2. 統合テスト不足
- コンポーネント間の連携テストが少ない
- ドラッグ&ドロップなどの複雑な操作のテストがない

### 3. カバレッジ目標未達成
- 現状26% vs 目標75%
- 約50%のギャップ（約30-35時間の作業必要）

---

## 💡 推奨アクション

1. **今すぐ実施**: KanbanBoard.test.tsx を作成（最重要コンポーネント）
2. **今週中**: Phase 1完了（コアコンポーネントのテスト）
3. **来週**: Phase 2開始（UI層のテスト）
4. **継続的改善**: 新機能追加時は必ずテストも追加

---

**作成日**: 2026-02-01
**次回レビュー予定**: 2026-02-08
