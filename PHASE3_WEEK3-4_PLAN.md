# Phase 3 Week 3-4 実装計画

**計画作成日**: 2026-02-01
**実装期間**: 2026-02-01 〜 2026-02-14（2週間）
**見積もり合計**: 28時間

---

## 📋 実装済み機能の確認

### Week 1（完了✅）
- ✅ Phase 3.0.1: 列の並べ替え機能（@dnd-kit統合）
- ✅ Phase 3.0.2: タイトル重複解消
- ✅ タスク複製機能（右クリックメニュー）

### Week 2（完了✅）
- ✅ 「自分のタスク」クイックフィルター
- ✅ レスポンシブ対応完成（タブレット2列、デスクトップ3+列）
- ✅ キーボードショートカット拡張（11個のショートカット）
- ✅ Phase 4.4: レスポンシブデザイン最適化（useMediaQuery, useSwipe）

### 追加実装
- ✅ モーダル透明度改善（bg-black/40 + backdrop-blur）
- ✅ 列削除バリデーション（タスク存在チェック、最後の列チェック）
- ✅ リストビュースクロールバグ修正
- ✅ USER_STORY_MAPPING.md作成
- ✅ IMPROVEMENT_PROPOSALS.md作成

---

## 🎯 Week 3-4 実装タスク

### 1. ダークモード対応（優先度：高）

**見積もり**: 5時間

#### 現状の問題
- ライトモードのみで夜間作業時に目が疲れる
- システム設定への自動追従がない

#### 実装内容

**1.1 Tailwind CSS dark mode設定**
```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ...
}
```

**1.2 テーマ管理フック作成**
- `src/hooks/useTheme.ts`を新規作成
- システム設定（prefers-color-scheme）の検出
- localStorage への保存
- テーマ切り替え関数

```typescript
// src/hooks/useTheme.ts
export type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    // Apply theme class
  }, [theme]);

  return { theme, setTheme };
};
```

**1.3 ヘッダーにトグルボタン追加**
- `src/components/layout/AppHeader.tsx`
- Sun/Moon アイコン（lucide-react）
- 3つのオプション: Light / Dark / System

**1.4 CSS変数の追加**
- `app/globals.css`にdark mode用カラー定義

```css
@layer base {
  :root {
    /* 既存のライトモード */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    /* ... */
  }
}
```

**1.5 全コンポーネントのdark対応**
- TaskCard: `dark:bg-zinc-800 dark:border-zinc-700`
- KanbanColumn: `dark:bg-zinc-900/50`
- Dialog: `dark:bg-zinc-900`
- など

#### テスト項目
- [ ] システム設定でダークモード自動切り替え
- [ ] 手動トグルで切り替え可能（Light/Dark/System）
- [ ] 設定がlocalStorageに保存される
- [ ] すべてのコンポーネントがダークモード対応
- [ ] タスクカードの色が見やすい

#### 完了基準
- システム設定への自動追従
- 手動切り替えトグル実装
- すべてのUIコンポーネントがdark対応
- localStorage永続化

---

### 2. カレンダービュー（簡易版）（優先度：中）

**見積もり**: 8時間

#### 現状の問題
- 期限ベースの全体像が見えない
- スケジュール管理が難しい

#### 実装内容

**2.1 カレンダービュータブ追加**
- `src/App.tsx`に3つ目のタブ追加
```typescript
<TabsTrigger value="calendar" className="flex items-center gap-2">
  <Calendar size={16} />
  カレンダービュー
</TabsTrigger>
```

**2.2 CalendarViewコンポーネント作成**
- `src/components/calendar/CalendarView.tsx`を新規作成
- react-day-picker使用（既にインストール済み）
- 月次カレンダー表示

```typescript
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export const CalendarView: React.FC = () => {
  const tasks = useBoardStore((state) => state.tasks);

  // 期限があるタスクを日付ごとにグループ化
  const tasksByDate = useMemo(() => {
    // ...
  }, [tasks]);

  return (
    <div className="flex gap-4">
      <DayPicker
        mode="single"
        modifiers={{ hasTasks: datesWithTasks }}
        modifiersClassNames={{ hasTasks: 'has-tasks' }}
        onDayClick={handleDayClick}
      />
      <TaskListForDate date={selectedDate} tasks={tasksByDate[selectedDate]} />
    </div>
  );
};
```

**2.3 日付別タスクリスト**
- 選択した日付のタスクを右側に表示
- クリックでTaskEditDialog表示

**2.4 カレンダーのスタイリング**
- Apple風のシンプルなデザイン
- 期限のある日にドット表示
- 今日をハイライト
- 過去の期限を赤色表示

#### テスト項目
- [ ] カレンダービュータブが表示される
- [ ] 期限のあるタスクが日付に表示される
- [ ] 日付をクリックするとタスクリストが表示される
- [ ] タスクをクリックで編集ダイアログが開く
- [ ] 今日がハイライトされる
- [ ] 過去の期限が赤色表示

#### 完了基準
- カレンダービュータブ追加
- react-day-picker統合
- 期限タスクの日付表示
- タスク編集連携

---

### 3. タスクにサブタスク追加（優先度：高）

**見積もり**: 10時間

#### 現状の問題
- 大きなタスクを分解できない
- 進捗が追跡しづらい

#### 実装内容

**3.1 型定義の拡張**
```typescript
// src/types/index.ts
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  // 既存フィールド
  id: string;
  title: string;
  // ... 他のフィールド

  // 新規追加
  subtasks?: Subtask[];
}
```

**3.2 Storeアクションの追加**
```typescript
// src/stores/useBoardStore.ts
interface BoardStore {
  // 既存...

  // サブタスク管理
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, title: string) => void;
}
```

**3.3 EditTaskDialogにサブタスクセクション追加**
- チェックボックスリスト
- 新規追加入力欄
- 削除ボタン
- 進捗表示

```typescript
// src/components/task/EditTaskDialog.tsx
<div className="space-y-2">
  <Label>サブタスク</Label>
  {subtasks.map((subtask) => (
    <div key={subtask.id} className="flex items-center gap-2">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
      />
      <Input value={subtask.title} onChange={...} />
      <Button variant="ghost" onClick={() => deleteSubtask(task.id, subtask.id)}>
        <Trash2 size={16} />
      </Button>
    </div>
  ))}

  <Button onClick={addNewSubtask}>+ サブタスクを追加</Button>
</div>
```

**3.4 TaskCardに進捗バー表示**
```typescript
// src/components/task/TaskCard.tsx
{task.subtasks && task.subtasks.length > 0 && (
  <div className="mt-2">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <CheckSquare size={12} />
      <span>{completedCount}/{task.subtasks.length}</span>
    </div>
    <Progress value={completionPercentage} className="h-1 mt-1" />
  </div>
)}
```

**3.5 進捗計算ロジック**
```typescript
const getSubtaskProgress = (task: Task): number => {
  if (!task.subtasks || task.subtasks.length === 0) return 0;
  const completed = task.subtasks.filter(st => st.completed).length;
  return (completed / task.subtasks.length) * 100;
};
```

#### テスト項目
- [ ] タスク編集でサブタスク追加できる
- [ ] サブタスク完了チェックできる
- [ ] サブタスク削除できる
- [ ] タスクカードに進捗バー表示される
- [ ] 進捗率が正しく計算される
- [ ] localStorage に保存される

#### 完了基準
- Subtask型定義
- Store actions実装
- EditTaskDialogにUI追加
- TaskCardに進捗バー表示
- テスト追加

---

### 4. ドラッグ&ドロップの視覚改善（Phase 4.3）（優先度：中）

**見積もり**: 5時間

#### 現状の問題
- ドラッグ中の視覚フィードバックが基本的
- Apple風の洗練されたアニメーションが欲しい

#### 実装内容

**4.1 ドラッグ中のスタイル改善**
```typescript
// src/components/task/SortableTaskCard.tsx
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
  scale: isDragging ? 1.05 : 1,
  zIndex: isDragging ? 1000 : 'auto',
  boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : undefined,
};
```

**4.2 ドロップ先プレビュー**
- @dnd-kit の DragOverlay を使用
- 点線ボックスでドロップ位置を表示

```typescript
// src/components/kanban/KanbanBoard.tsx
<DragOverlay>
  {activeId ? (
    <TaskCard task={tasks[activeId]} isDragOverlay />
  ) : null}
</DragOverlay>
```

**4.3 無効なドロップ先の視覚化**
- 無効な列に赤枠表示
- カーソルを `not-allowed` に変更

**4.4 スムーズなアニメーション**
```css
/* app/globals.css */
.sortable-item {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.drag-overlay {
  animation: lift 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes lift {
  from {
    transform: scale(1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  to {
    transform: scale(1.05);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }
}
```

#### テスト項目
- [ ] ドラッグ中のカードが拡大・半透明になる
- [ ] ドロップ先が明確にわかる
- [ ] スムーズなアニメーション
- [ ] 無効なドロップ先が視覚的にわかる

#### 完了基準
- ドラッグ中の視覚改善
- DragOverlay実装
- スムーズなアニメーション
- Apple風デザイン

---

## 🧪 品質確認チェックリスト

各タスク完了後、以下を**必ず実行**:

1. **ビルド確認**: `npm run build` が成功すること
2. **テスト確認**: `npm run test -- --run` が全パスすること
3. **E2E確認**: `npm run test:e2e` がパスすること（該当する場合）
4. **画面表示確認**: アプリを起動して白い画面でないこと
5. **コンソール確認**: ブラウザコンソールにエラーがないこと
6. **機能確認**: 実装した機能が正常に動作すること
7. **Best Practiceレビュー**: Vercel React Best Practiceスキルでレビュー

---

## 📦 コミット戦略

各機能ごとに以下のフォーマットでコミット:

```bash
feat: <機能名>を実装（Phase X.X）

- 詳細1
- 詳細2
- 詳細3

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**例**:
```bash
feat: ダークモード対応を実装（Week 3-4）

- Tailwind CSS dark mode設定
- useTheme フック作成
- ヘッダーにトグルボタン追加
- 全コンポーネントのdark対応

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🎯 成功指標

### 技術指標
- テストカバレッジ: 75%以上維持
- ビルドサイズ: 600KB以下
- テスト実行時間: 5秒以内

### ユーザー体験指標
- ダークモード: システム設定に即時追従
- カレンダー: 期限タスク一覧が1秒以内に表示
- サブタスク: 進捗バーが即座に更新
- D&D: アニメーションが60fps維持

---

## 📅 実装スケジュール

### Week 3（2026-02-01 〜 2026-02-07）
- **Day 1-2**: ダークモード対応（5時間）
- **Day 3-4**: カレンダービュー（8時間）

### Week 4（2026-02-08 〜 2026-02-14）
- **Day 1-3**: サブタスク機能（10時間）
- **Day 4**: D&D視覚改善（5時間）
- **Day 5**: 統合テスト、ドキュメント更新

---

## 🔄 次のフェーズ予定

### Month 2（3月: Phase 4残り + Phase 5準備）
1. Apple風UIデザイン完成（Phase 4残り）- 20時間
2. E2Eテスト追加 - 10時間
3. SharePoint連携準備（調査・設計）- 10時間

**合計**: 40時間

---

**作成日**: 2026-02-01
**最終更新**: 2026-02-01
**ステータス**: 実装準備完了
