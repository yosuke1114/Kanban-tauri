# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kanban-Rust is a TODO management tool built with Tauri + React + TypeScript for Japanese business professionals. It features a kanban board with drag-and-drop functionality, member management, tags, and priority tracking.

## Essential Commands

### Development

```bash
npm run tauri dev    # Start Tauri app in development mode
npm run dev          # Start Vite dev server only (for web-only testing)
```

### Build

```bash
npm run build        # Build TypeScript and frontend (tsc + vite build)
npm run tauri build  # Build complete Tauri application
```

### Type Checking

```bash
tsc --noEmit         # Type check without emitting files
```

## Architecture

### State Management: Zustand Store Pattern

The application uses a centralized Zustand store (`src/stores/useBoardStore.ts`) that manages all application state. This is the **single source of truth** for:

- Tasks (with position tracking for drag-and-drop)
- Columns (customizable, with 3 default columns)
- Members (team members with active/inactive status)
- Tags (color-coded labels)
- Filters (not yet implemented)

**Key Pattern**: All state mutations happen through store actions (e.g., `addTask`, `moveTask`, `updateTask`). Components should never mutate state directly. The store automatically persists to localStorage after mutations via `saveToStorage()`.

### Type System: Central Type Definitions

All domain types are defined in `src/types/index.ts`. Key interfaces:

- **Task**: Core entity with `columnId` and `position` for drag-and-drop ordering
- **Column**: Represents kanban columns (has `isDefault` flag - default columns cannot be deleted)
- **Member**: Team members with `isActive` for soft deletion
- **Tag**: Simple name + color structure
- **SyncMetadata**: Prepared for future SharePoint sync (not yet implemented)

### Drag-and-Drop: @dnd-kit Architecture

The kanban board uses `@dnd-kit` with the following structure:

1. **KanbanBoard** (src/components/kanban/KanbanBoard.tsx): Root DndContext

   - Manages `DragStartEvent` and `DragEndEvent`
   - Handles drop logic: determines target column and position
   - Uses `SortableContext` for each column

2. **SortableTaskCard** (src/components/task/SortableTaskCard.tsx): Draggable wrapper

   - Uses `useSortable` hook
   - Wraps TaskCard with drag attributes/listeners
   - Opens EditTaskDialog on click

3. **Position Management**: Tasks have a `position` field (number) within their column. When a task moves, the store recalculates positions for all affected tasks in the target column.

### Tauri Commands (Rust Backend)

Located in `src-tauri/src/main.rs`:

- `save_board_data(data: String)`: Save board state to file
- `load_board_data()`: Load board state from file
- `get_data_path()`: Get app data directory path

**Note**: Currently, the frontend still uses localStorage. The Tauri file storage is prepared but not yet integrated. To switch to file storage, update `useBoardStore` to call the Tauri commands instead of localStorage.

### Component Organization

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (don't modify directly)
│   ├── kanban/          # Kanban board and column components
│   ├── task/            # Task card and edit dialog
│   ├── member/          # Member management
│   └── tag/             # Tag management
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
└── services/storage/    # Storage abstraction (prepared for Tauri)
```

### Styling: Tailwind + Custom Color Scheme

The project uses Tailwind CSS with a custom color scheme optimized for visibility (defined in `app/globals.css`):

- **Background**: Warm off-white (`--background: 40 20% 98%`)
- **Primary**: Calm blue (`--primary: 215 55% 45%`)
- **Accent**: Soft teal (`--accent: 175 40% 45%`)
- **Priority colors**: Green (low) → Yellow (medium) → Orange (high) → Red (urgent)
- **Due date colors**: Red (overdue) → Orange (today) → Yellow (soon)

Colors are applied via CSS custom properties, not hardcoded.

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts).

Always use `@/` imports for cleaner paths:

```typescript
import { useBoardStore } from "@/stores/useBoardStore";
import { Task } from "@/types";
```

## Important Implementation Notes

### Date Handling

Use `date-fns` with Japanese locale for date formatting:

```typescript
import { format } from "date-fns";
import { ja } from "date-fns/locale";

format(new Date(task.dueDate), "M/d (E)", { locale: ja });
```

### Default Columns Cannot Be Deleted

The three default columns (未着手/進行中/完了) have `isDefault: true`. The `deleteColumn` action in the store checks this flag and prevents deletion. Always preserve this check when modifying column deletion logic.

### Task Position Recalculation

When moving tasks, the `moveTask` action recalculates positions for all tasks in the target column. This ensures consistent ordering. Don't manually set positions outside of this action.

### Member/Tag Soft Deletion

- **Members**: Use `isActive` flag for soft deletion (preserves data in existing tasks)
- **Tags**: Hard deletion removes tag from all tasks automatically
- When deleting, the store actions clean up task references

## Implemented Features

These features are now fully implemented:

1. **Filters**: FilterState type and logic are implemented in `useBoardStore.getFilteredTasks()`
   - Tag filtering
   - Assignee filtering
   - Priority filtering
   - Due date range filtering (prepared in types)
2. **Recurrence**: RecurrenceRule for repeating tasks is implemented
   - Automatic generation on app startup via `generateRecurringTasks()`
   - Completed recurring tasks generate new instances in "未着手" column
3. **Tauri File Storage**: Integrated via `src/services/storage/tauriStorage.ts`
   - Automatic fallback to localStorage in web mode
   - Seamless storage abstraction

## Pending/Future Features

These are prepared in types but not yet implemented:

1. **SharePoint Sync**: SyncMetadata prepared for future integration
2. **Desktop Notifications**: Planned for overdue tasks (Tauri notification API)
3. **List View**: Alternative table-based view (not implemented)
4. **Filter UI**: Backend logic exists, but UI controls (FilterPanel) not yet implemented
5. **Date Picker Integration**: react-day-picker installed but not yet used in UI for due date range filtering

## Known Constraints

- Tauri v1 (not v2) - uses older API patterns
- No test suite currently exists
- No linting configured (only TypeScript strict mode)
- Date picker (react-day-picker) installed but not yet used in UI

## TDD

- t-wada style
- as you could , e2e with playwright

## 品質確認チェックリスト

### コード変更後の必須確認

すべてのコード変更後に以下を**必ず実行**してください:

1. **ビルド確認**: `npm run build` が成功すること
2. **テスト確認**: `npm run test -- --run` が全パスすること (93テスト)
3. **E2E確認**: `npm run test:e2e` がパスすること
4. **画面表示確認**: アプリを起動して白い画面でないこと
5. **コンソール確認**: ブラウザコンソールにエラーがないこと
6. **機能確認**: 変更した機能が正常に動作すること
7. **Best Practiceレビュー**: React/UI変更時は必須

### 特に注意が必要な変更

- **Zustandストアの変更**: セレクター内で関数呼び出しをしない（下記参照）
- **useEffectの変更**: 無限ループの可能性を確認
- **状態管理の変更**: 再レンダリングの影響を確認

### Zustandストアのベストプラクティス

**❌ 危険なパターン（無限ループの原因）:**

```typescript
// セレクター内で関数を呼び出す → 毎回新しい値 → 無限ループ
const data = useStore((state) => state.getData());
```

**✅ 安全なパターン:**

```typescript
// 方法1: 状態を直接購読
const tasks = useStore((state) => state.tasks);

// 方法2: useMemoでメモ化
const tasks = useStore((state) => state.tasks);
const filteredTasks = useMemo(() => filterTasks(tasks), [tasks]);
```

## Review

- frontend の場合は Vercel React Best Practice スキルを使って毎回レビューすること。
