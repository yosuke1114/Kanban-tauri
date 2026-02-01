# React Best Practice レビュー結果

**レビュー日**: 2026-02-01
**対象ファイル**:
- src/hooks/useMediaQuery.ts
- src/components/layout/AppHeader.tsx
- src/components/kanban/ColumnManager.tsx
- src/components/kanban/KanbanBoard.tsx
- src/App.tsx

---

## 🔴 重大な問題（Critical）

### 1. `rerender-defer-reads` - Zustandストアの過剰購読（AppHeader.tsx）

**問題箇所**: AppHeader.tsx Line 32-39

```typescript
// ❌ BAD: 8つの異なるストア値を個別に購読
const searchQuery = useBoardStore((state) => state.searchQuery);
const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
const addTask = useBoardStore((state) => state.addTask);
const members = useBoardStore((state) => state.members);
const currentUserId = useBoardStore((state) => state.currentUserId);
const setCurrentUserId = useBoardStore((state) => state.setCurrentUserId);
const toggleMyTasks = useBoardStore((state) => state.toggleMyTasks);
const filters = useBoardStore((state) => state.filters);
```

**影響**:
- ストアの任意の値が変更されるたびに、AppHeaderが8回の購読チェックを実行
- 不要な再レンダリングのリスク
- パフォーマンス劣化

**推奨修正**:
```typescript
// ✅ GOOD: 必要な値のみを1つのセレクターで購読
const { searchQuery, members, currentUserId, filters } = useBoardStore((state) => ({
  searchQuery: state.searchQuery,
  members: state.members,
  currentUserId: state.currentUserId,
  filters: state.filters,
}), shallow);

// アクション関数は別途取得（変更されないため）
const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
const addTask = useBoardStore((state) => state.addTask);
const setCurrentUserId = useBoardStore((state) => state.setCurrentUserId);
const toggleMyTasks = useBoardStore((state) => state.toggleMyTasks);
```

**優先度**: 🔴 高（全ページで影響あり）

---

### 2. `rerender-derived-state` - 派生状態の計算（AppHeader.tsx）

**問題箇所**: AppHeader.tsx Line 42

```typescript
// ❌ BAD: 派生状態をコンポーネント内で計算
const isMyTasksActive = currentUserId && filters.assigneeIds.includes(currentUserId);
```

**影響**:
- filters が変更されるたびに再計算
- 不要な再レンダリングの原因

**推奨修正**:
```typescript
// ✅ GOOD: useMemo でメモ化
const isMyTasksActive = useMemo(() =>
  currentUserId && filters.assigneeIds.includes(currentUserId),
  [currentUserId, filters.assigneeIds]
);
```

**または Zustand ストアで計算**:
```typescript
// stores/useBoardStore.ts
const isMyTasksActive = useBoardStore((state) => {
  if (!state.currentUserId) return false;
  return state.filters.assigneeIds.includes(state.currentUserId);
});
```

**優先度**: 🟡 中

---

### 3. `client-event-listeners` - イベントリスナーの重複登録（useMediaQuery.ts）

**問題箇所**: useMediaQuery.ts Line 11-31

```typescript
// ⚠️ CAUTION: 各useMediaQuery呼び出しで個別のリスナー登録
export const useMediaQuery = (query: string): boolean => {
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
};
```

**影響**:
- KanbanBoard.tsxで `useViewportSize()` が内部で3回 `useMediaQuery()` を呼び出し
- 3つの異なるメディアクエリリスナーが登録される
- 現状では問題ないが、将来的にパフォーマンス影響の可能性

**推奨修正**:
```typescript
// ✅ GOOD: グローバルな matchMedia マネージャーを作成
// src/hooks/useMediaQuery.ts
const mediaQueryCache = new Map<string, MediaQueryList>();

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    let media = mediaQueryCache.get(query);
    if (!media) {
      media = window.matchMedia(query);
      mediaQueryCache.set(query, media);
    }
    return media.matches;
  });

  useEffect(() => {
    const media = mediaQueryCache.get(query)!;
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};
```

**優先度**: 🟢 低（将来的な最適化）

---

### 4. `rerender-memo-with-default-value` - デフォルトオブジェクトの作成（KanbanBoard.tsx）

**問題箇所**: KanbanBoard.tsx Line 67-71

```typescript
// ⚠️ CAUTION: swipeHandlers が毎回新しいオブジェクトとして作成される可能性
const swipeHandlers = useSwipe({
  onSwipeLeft: handleSwipeLeft,
  onSwipeRight: handleSwipeRight,
  threshold: 50,
});
```

**影響**:
- handleSwipeLeft/Right が useCallback でメモ化されているため、現状は問題ない
- しかし、useSwipeの内部実装次第では不要な再作成の可能性

**推奨修正**:
```typescript
// ✅ GOOD: オプションオブジェクトをuseMemoでメモ化
const swipeOptions = useMemo(() => ({
  onSwipeLeft: handleSwipeLeft,
  onSwipeRight: handleSwipeRight,
  threshold: 50,
}), [handleSwipeLeft, handleSwipeRight]);

const swipeHandlers = useSwipe(swipeOptions);
```

**優先度**: 🟢 低（現状問題なし）

---

### 5. `rendering-hoist-jsx` - 静的JSXのホイスト（ColumnManager.tsx）

**問題箇所**: ColumnManager.tsx Line 47-56

```typescript
// ⚠️ CAUTION: colorOptions が毎回再作成される
const colorOptions = [
  { color: "#94a3b8", name: "グレー" },
  { color: "#60a5fa", name: "ブルー" },
  // ... 8個の要素
];
```

**影響**:
- ColumnManager がレンダリングされるたびに配列が再作成される
- 軽微なメモリ浪費

**推奨修正**:
```typescript
// ✅ GOOD: コンポーネント外にホイスト
const COLOR_OPTIONS = [
  { color: "#94a3b8", name: "グレー" },
  { color: "#60a5fa", name: "ブルー" },
  { color: "#34d399", name: "グリーン" },
  { color: "#fbbf24", name: "イエロー" },
  { color: "#fb923c", name: "オレンジ" },
  { color: "#f87171", name: "レッド" },
  { color: "#a78bfa", name: "パープル" },
  { color: "#ec4899", name: "ピンク" },
] as const;

const ColumnManager: React.FC<ColumnManagerProps> = ({ open, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].color);
  // ...
};
```

**優先度**: 🟡 中

---

### 6. `rerender-dependencies` - useEffect依存配列の問題（KanbanBoard.tsx）

**問題箇所**: KanbanBoard.tsx Line 89-97

```typescript
// ❌ BAD: 依存配列が空なのに、loadFromStorage と generateRecurringTasks を使用
useEffect(() => {
  const initializeData = async () => {
    await loadFromStorage();
    generateRecurringTasks();
  };
  initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**影響**:
- React の exhaustive-deps ルールを無視
- loadFromStorage/generateRecurringTasks が変更されても再実行されない
- ただし、これらは Zustand アクションなので実際には安定している

**推奨修正**:
```typescript
// ✅ GOOD: アクションは安定しているため、依存配列に追加しても問題ない
useEffect(() => {
  const initializeData = async () => {
    await loadFromStorage();
    generateRecurringTasks();
  };
  initializeData();
}, [loadFromStorage, generateRecurringTasks]);
```

**または、初期化フラグを使用**:
```typescript
// ✅ BETTER: 初期化を1回のみ実行することを明示
const [isInitialized, setIsInitialized] = useState(false);

useEffect(() => {
  if (!isInitialized) {
    const initializeData = async () => {
      await loadFromStorage();
      generateRecurringTasks();
      setIsInitialized(true);
    };
    initializeData();
  }
}, [isInitialized, loadFromStorage, generateRecurringTasks]);
```

**優先度**: 🟡 中

---

## 🟢 良好な実装

### 1. ✅ `rerender-memo` - コンポーネントのメモ化

KanbanColumn.tsx Line 43:
```typescript
export default React.memo(KanbanColumn);
```
→ 正しくメモ化されている

---

### 2. ✅ `advanced-event-handler-refs` - useCallbackの使用

KanbanBoard.tsx Line 113-119, 121-151:
```typescript
const handleDragStart = useCallback(...);
const handleDragEnd = useCallback(...);
```
→ イベントハンドラーが正しくメモ化されている

---

### 3. ✅ `rerender-lazy-state-init` - useState初期化

KanbanBoard.tsx Line 42-44:
```typescript
const [activeColumnId, setActiveColumnId] = useState<string>(
  columnOrder[0] || ""
);
```
→ 軽量な初期化のため問題なし

---

## 📊 優先度別まとめ

| 優先度 | 問題数 | 項目 |
|--------|--------|------|
| 🔴 高 | 1 | Zustandストアの過剰購読（AppHeader） |
| 🟡 中 | 3 | 派生状態、静的JSXホイスト、useEffect依存配列 |
| 🟢 低 | 2 | イベントリスナー最適化、swipeHandlers |

---

## 🎯 推奨修正順序

### 1. 最優先（今すぐ修正）
- [ ] AppHeader.tsx: Zustandストアの購読を最適化

### 2. 次に修正（今週中）
- [ ] AppHeader.tsx: isMyTasksActive を useMemo でメモ化
- [ ] ColumnManager.tsx: colorOptions をコンポーネント外にホイスト
- [ ] KanbanBoard.tsx: useEffect 依存配列を修正

### 3. 将来的な最適化
- [ ] useMediaQuery.ts: グローバル matchMedia キャッシュ実装
- [ ] KanbanBoard.tsx: swipeHandlers の useMemo 化

---

## 📝 追加の推奨事項

### A. Zustand Shallow Compare の導入

```bash
npm install zustand@^4.0.0
```

```typescript
import { shallow } from 'zustand/shallow';

// 複数の値を購読する際に使用
const { members, currentUserId } = useBoardStore(
  (state) => ({
    members: state.members,
    currentUserId: state.currentUserId,
  }),
  shallow
);
```

### B. React DevTools Profiler の活用

- 再レンダリングの頻度を測定
- パフォーマンスボトルネックを特定

---

**レビュアー**: Claude Sonnet 4.5
**作成日**: 2026-02-01
