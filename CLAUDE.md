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

- Tasks (with position tracking for drag-and-drop, subtasks support)
- Columns (customizable, with 3 default columns)
- Members (team members with active/inactive status)
- Tags (color-coded labels)
- Filters (fully implemented with UI)
- Boards (multi-board support)

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

### Styling: Tailwind + Slack-Inspired Theme

The project uses Tailwind CSS with a Slack-inspired color scheme (defined in `app/globals.css`):

- **Background**: Clean white (`--background: 0 0% 100%`)
- **Primary**: Aubergine purple (`--primary: 306 50% 30%`) - Slack's signature color
- **Accent**: Professional teal (`--accent: 174 71% 39%`)
- **Muted**: Warm gray (`--muted: 27 8% 94%`)
- **Glass effect**: `backdrop-blur-xl` with transparency for modern UI
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

1. **Multi-Board Support**: Create and manage multiple project boards

   - Board switching with selector
   - Each board has independent tasks, columns, members, tags
   - Board management UI

2. **Filters (Full Implementation)**: Complete filter system

   - Tag filtering (UI: FilterPanel)
   - Assignee filtering (UI: FilterPanel)
   - Priority filtering (UI: FilterPanel)
   - Filter count badge display
   - Clear filters button

3. **Input Validation**: Comprehensive validation system (`src/constants/validation.ts`)

   - Task title: 100 characters max
   - Task description: 500 characters max
   - Subtask title: 100 characters max
   - Member name: 50 characters max
   - Tag name: 30 characters max
   - Column title: 30 characters max
   - Real-time validation with error messages
   - Character counters on all inputs

4. **Subtasks**: Checklist-style subtasks in tasks

   - Add, toggle, delete subtasks
   - Progress tracking in EditTaskDialog

5. **Calendar View**: Date-based task visualization

   - Monthly calendar with react-day-picker
   - Tasks displayed on due date
   - Click to open task details

6. **List View**: Table-based alternative view

   - Sortable columns (title, priority, due date, created date)
   - Click row to edit task
   - Optimized SortIcon component

7. **Keyboard Shortcuts**: Extensive keyboard navigation

   - ⌘K (Ctrl+K): Focus search
   - ⌘N (Ctrl+N): New task
   - Esc: Close dialogs
   - [Full list in AppHeader component]

8. **Responsive Design**: Mobile-first approach

   - Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
   - Mobile: Icon-only buttons, responsive spacing
   - All components optimized for small screens

9. **Soft Delete & Archive**: Non-destructive task management

   - Trash: Soft delete with 30-day auto-deletion
   - Archive: Long-term storage
   - Restore functionality

10. **Recurrence**: RecurrenceRule for repeating tasks

    - Automatic generation on app startup via `generateRecurringTasks()`
    - Completed recurring tasks generate new instances in "未着手" column

11. **Tauri File Storage**: Integrated via `src/services/storage/tauriStorage.ts`
    - Automatic fallback to localStorage in web mode
    - Seamless storage abstraction

## Pending/Future Features

These are next on the roadmap:

1. **Column Reordering**: GripVertical アイコンはあるが、D&D 機能は未実装
2. **Desktop Notifications**: Planned for overdue tasks (Tauri notification API)
3. **Date Range Filter**: react-day-picker installed, integrate into FilterPanel
4. **Dark Mode**: Theme toggle with system preference support
5. **SharePoint Sync**: SyncMetadata prepared for future integration
6. **Statistics Dashboard**: Completion rate, productivity metrics
7. **Performance Optimizations**: React.memo, useCallback, virtualization

詳細は `/Users/yo_kuro/kanban-rust/NEXT_DEVELOPMENT_PLAN.md` を参照

## Known Constraints

- Tauri v1 (not v2) - uses older API patterns
- ESLint not configured (TypeScript strict mode only)
- Column reordering UI incomplete (GripVertical icon present but non-functional)
- Title duplication exists (App.tsx header and KanbanBoard.tsx both show "Kanban Board")

## TDD

- t-wada 形式で要件が出たらテストを書くこと
- E2E テストは playwright を使用しフェイズの終わりにカバレッジ確認。テスト作成、修正実施すること。

## 品質確認チェックリスト

### コード変更後の必須確認

すべてのコード変更後に以下を**必ず実行**してください:

1. **ビルド確認**: `npm run build` が成功すること
2. **テスト確認**: `npm run test -- --run` が全パスすること (324 テスト)
3. **E2E 確認**: `npm run test:e2e` がパスすること
4. **画面表示確認**: アプリを起動して白い画面でないこと
5. **コンソール確認**: ブラウザコンソールにエラーがないこと
6. **機能確認**: 変更した機能が正常に動作すること
7. **Best Practice レビュー**: React/UI 変更時は必須

### 特に注意が必要な変更

- **Zustand ストアの変更**: セレクター内で関数呼び出しをしない（下記参照）
- **useEffect の変更**: 無限ループの可能性を確認
- **状態管理の変更**: 再レンダリングの影響を確認

### Zustand ストアのベストプラクティス

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

## Document

- 機能完了、計画実施、修正など対応した場合は逐次 MD ファイルを確認し、最新内容に更新すること
