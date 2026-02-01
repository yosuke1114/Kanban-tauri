# テスト戦略ドキュメント

**作成日**: 2026-02-01
**対象**: Kanban Board アプリケーション

---

## 🏆 テスティングトロフィーに基づく戦略

### テスティングトロフィーとは

Kent C. Doddsが提唱する、各テストレベルの適切な比率を示すモデル：

```
        /\
       /  \  E2E Tests (10%)
      /____\
     /      \  Integration Tests (50%)
    /________\
   /          \ Unit Tests (30%)
  /____________\
 /              \ Static Analysis (TypeScript, ESLint)
/________________\
```

### 本プロジェクトでの適用

| テストレベル | 比率 | 実装状況 | 優先度 |
|------------|------|---------|--------|
| Static | 基盤 | ✅ TypeScript strict mode | - |
| Unit | 30% | ✅ 一部実装（services, stores） | 中 |
| Integration | 50% | 🟡 強化が必要 | **高** |
| E2E | 10% | 🔴 未実装（Playwright設定のみ） | 中 |

---

## 📋 テストレベル別の方針

### 1. Static Analysis（静的解析）✅

**現状**:
- TypeScript strict mode有効
- ESLint未設定

**アクション**:
- 現状維持（TypeScriptで十分）
- 必要に応じてESLint追加を検討

---

### 2. Unit Tests（単体テスト）30%

**対象**:
- Pure functions（ユーティリティ関数）
- サービス層（recurrenceService, notificationService）
- カスタムフック（useFilteredTasks）
- Zustandストアのアクション

**現状**: ✅ 十分に実装済み
- `recurrenceService.test.ts` (93.75% coverage)
- `notificationService.test.ts` (100% coverage)
- `useFilteredTasks.test.ts` (70.58% coverage)
- `useBoardStore.test.ts` (63.09% coverage)

**方針**:
```typescript
// ✅ Good: Pure functionのテスト
describe('calculateNextDueDate', () => {
  it('日次繰り返しで次の期限を計算できる', () => {
    const result = calculateNextDueDate(
      '2026-01-01',
      { type: 'daily', interval: 1 }
    );
    expect(result).toBe('2026-01-02');
  });
});
```

**モック方針**: 最小限
- 外部依存（localStorage, Notification API）のみモック
- ビジネスロジックは実装を使用

---

### 3. Integration Tests（統合テスト）50% ⭐ **最重要**

**対象**:
- コンポーネント + ストア + UI相互作用
- ユーザーフロー（タスク作成→編集→削除）
- コンポーネント間の連携

**現状**: 🟡 強化が必要
- コンポーネント単体テストが中心
- 統合的な視点が不足

**方針**:
```typescript
// ✅ Good: 統合テスト
describe('タスク作成から編集までのフロー', () => {
  it('タスクを作成して編集できる', async () => {
    const user = userEvent.setup();

    // 実際のストアを使用（モックなし）
    render(<App />);

    // 1. タスク作成
    const input = screen.getByPlaceholderText('新しいタスクを追加...');
    await user.type(input, '統合テストタスク{Enter}');

    // 2. タスクが表示される
    const task = await screen.findByText('統合テストタスク');
    expect(task).toBeInTheDocument();

    // 3. タスククリックで編集ダイアログが開く
    await user.click(task);

    // 4. タイトルを編集
    const titleInput = screen.getByDisplayValue('統合テストタスク');
    await user.clear(titleInput);
    await user.type(titleInput, '編集後タスク');

    // 5. 保存
    await user.click(screen.getByRole('button', { name: '保存' }));

    // 6. 更新が反映される
    expect(screen.getByText('編集後タスク')).toBeInTheDocument();
    expect(screen.queryByText('統合テストタスク')).not.toBeInTheDocument();
  });
});
```

**モック方針**: 最小限
- Zustandストアは実装を使用（リセットのみ）
- localStorage/sessionStorageはvitest環境がサポート
- 外部API（将来のSharePoint連携）のみモック

---

### 4. E2E Tests（エンドツーエンドテスト）10%

**対象**:
- クリティカルユーザーフロー
- クロスブラウザ動作確認
- パフォーマンス計測

**現状**: 🔴 未実装

**優先フロー**:
1. タスク作成→D&D移動→完了
2. 列の追加→タスク移動→列削除バリデーション
3. フィルター適用→タスク表示→解除
4. サブタスク追加→完了チェック→進捗確認

**実装計画**: Phase 2-3で実装

```typescript
// playwright/e2e/task-lifecycle.spec.ts
test('タスクのライフサイクル', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // タスク作成
  await page.fill('[placeholder="新しいタスクを追加..."]', 'E2Eテスト');
  await page.press('[placeholder="新しいタスクを追加..."]', 'Enter');

  // D&Dで移動
  const task = page.locator('text=E2Eテスト');
  await task.dragTo(page.locator('text=進行中').locator('..'));

  // 進行中列に移動したことを確認
  await expect(
    page.locator('text=進行中').locator('..').locator('text=E2Eテスト')
  ).toBeVisible();
});
```

---

## 🎯 セレクター戦略の検討結果

### オプション比較

| アプローチ | メリット | デメリット | 判定 |
|-----------|---------|-----------|------|
| `data-testid` | テスト安定性高、セレクター明確 | 実装詳細に依存、プロダクションコードに影響 | 🟡 部分採用 |
| ARIA/Role | アクセシビリティ向上、実ユーザー体験に近い | 複雑なUIで衝突しやすい | ✅ 優先 |
| Text/Label | 最もユーザー視点、i18n準備 | テキスト変更で壊れやすい | ✅ 第二優先 |
| CSS Class | 実装が簡単 | スタイル変更で壊れやすい | ❌ 非推奨 |

### 採用戦略: **ハイブリッドアプローチ**

#### 1. 基本方針: ARIA + Text（優先）

```typescript
// ✅ Good: ユーザー視点のセレクター
await user.click(screen.getByRole('button', { name: '保存' }));
expect(screen.getByText('タスクを保存しました')).toBeInTheDocument();

// ✅ Good: アクセシビリティを意識
const input = screen.getByLabelText('タスクタイトル');
```

#### 2. 例外: `data-testid`を使うケース

以下の場合のみ`data-testid`を追加：

**ケース1: 複数の同じ役割の要素が存在**
```typescript
// ❌ Bad: 複数のボタンがマッチ
const addButton = screen.getByRole('button', { name: '' }); // Error!

// ✅ Good: data-testid で明確化
<Button data-testid="add-column-button">
  <Plus size={20} />
</Button>

const addButton = screen.getByTestId('add-column-button');
```

**ケース2: 動的コンテンツで特定が困難**
```typescript
// ✅ Good: タスクカードにtest-id
<div data-testid={`task-card-${task.id}`}>
  {task.title}
</div>

const taskCard = screen.getByTestId('task-card-123');
```

**ケース3: D&D操作対象**
```typescript
// ✅ Good: ドラッグ操作の起点/終点を明確化
<div data-testid="kanban-column-todo">
  ...
</div>

await dragAndDrop(
  screen.getByTestId('task-card-123'),
  screen.getByTestId('kanban-column-inProgress')
);
```

#### 3. 命名規則

```typescript
// ✅ Good: 一貫した命名規則
data-testid="[component]-[element]-[identifier]"

// 例:
data-testid="task-card-123"           // TaskCard コンポーネント
data-testid="column-manager-add-btn"  // ColumnManager の追加ボタン
data-testid="kanban-column-todo"      // KanbanColumn (todo列)
```

---

## 📐 実装ガイドライン

### コンポーネントへの`data-testid`追加方針

**追加する箇所**:
1. ✅ リスト項目（タスクカード、列、メンバー、タグ）
2. ✅ アイコンのみのボタン（Plus, Trash, Edit等）
3. ✅ D&D対象要素
4. ✅ 複雑なフォーム（複数の同じ要素が存在）

**追加しない箇所**:
1. ❌ 明確なラベルがあるボタン（「保存」「削除」等）
2. ❌ 一意のテキストを持つ要素
3. ❌ ARIA roleで十分特定できる要素

### 実装例

```typescript
// src/components/task/TaskCard.tsx
export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <Card data-testid={`task-card-${task.id}`}>
      <CardTitle>{task.title}</CardTitle>
      {/* ... */}
    </Card>
  );
};

// src/components/kanban/ColumnManager.tsx
export const ColumnManager: React.FC<Props> = ({ open, onClose }) => {
  return (
    <Dialog open={open}>
      <Input placeholder="列名を入力" data-testid="column-name-input" />
      <Button data-testid="add-column-button">
        <Plus size={20} />
      </Button>
      {/* ... */}
    </Dialog>
  );
};
```

---

## 🧪 テストファイル構成

### Phase 1-3のファイル構成

```
src/
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanBoard.test.tsx          # 統合テスト
│   │   ├── KanbanBoard.integration.test.tsx # 追加予定
│   │   ├── KanbanColumn.tsx
│   │   └── ColumnManager.test.tsx        # 統合テスト
│   ├── task/
│   │   ├── TaskCard.test.tsx             # 単体テスト ✅
│   │   ├── EditTaskDialog.test.tsx       # 統合テスト
│   │   └── SortableTaskCard.test.tsx     # 追加予定
│   └── layout/
│       └── AppHeader.test.tsx            # 追加予定
├── services/
│   ├── recurrence/
│   │   └── recurrenceService.test.ts     # 単体テスト ✅
│   └── notification/
│       └── notificationService.test.ts   # 単体テスト ✅
├── hooks/
│   ├── useFilteredTasks.test.ts          # 単体テスト ✅
│   ├── useMediaQuery.test.ts             # 追加予定
│   └── useSwipe.test.ts                  # 追加予定
└── stores/
    └── useBoardStore.test.ts             # 単体テスト ✅
```

### E2Eテスト構成（Phase 2-3）

```
e2e/
├── task-lifecycle.spec.ts                # タスクのCRUD
├── column-management.spec.ts             # 列の管理
├── filter-and-search.spec.ts             # フィルター・検索
└── responsive-mobile.spec.ts             # レスポンシブ対応
```

---

## 📊 カバレッジ目標

| メトリック | 現状 | Phase 1目標 | Phase 2-3目標 |
|-----------|------|-------------|--------------|
| Statements | 26% | 50% | 75% |
| Branches | 25% | 45% | 70% |
| Functions | 25% | 50% | 75% |
| Lines | 26% | 50% | 75% |

### 重点カバレッジ領域

**Phase 1（統合テスト中心）**:
- ✅ KanbanBoard + KanbanColumn + TaskCard
- ✅ ColumnManager + ストア
- ✅ EditTaskDialog + サブタスク + ストア

**Phase 2（UI層）**:
- AppHeader + フィルター + 検索
- ListView + ソート
- CalendarView + 日付フィルター

**Phase 3（フック・サービス層）**:
- useMediaQuery + useSwipe
- useBoardStore（残りのアクション）

---

## 🚀 次のアクション

### 即座に実施

1. **失敗テストの修正**
   - セレクター戦略に基づいて`data-testid`を追加
   - モックの設定を修正

2. **統合テストの追加**
   - KanbanBoard.integration.test.tsx
   - タスクライフサイクルのフロー

### Phase 2で実施

3. **E2Eテストの実装**
   - Playwrightで4つのクリティカルフロー

4. **カバレッジの改善**
   - Phase 2のコンポーネントテスト追加

---

**作成者**: Claude Sonnet 4.5
**レビュー日**: 2026-02-01
