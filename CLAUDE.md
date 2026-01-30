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

## Pending/Future Features

These are prepared in types but not yet implemented:

1. **Filters**: FilterState type exists, but UI and logic are not implemented
2. **Recurrence**: RecurrenceRule type exists for repeating tasks (not implemented)
3. **Tauri File Storage**: Commands exist, but frontend still uses localStorage
4. **SharePoint Sync**: SyncMetadata prepared for future integration
5. **Desktop Notifications**: Planned for overdue tasks (Tauri notification API)
6. **List View**: Alternative table-based view (not implemented)

## Known Constraints

- Tauri v1 (not v2) - uses older API patterns
- No test suite currently exists
- No linting configured (only TypeScript strict mode)
- Date picker (react-day-picker) installed but not yet used in UI

## TDD

- t-wada style
- as you could , e2e with playwright

## Review

- frontend の場合は Vercel React Best Practice スキルを使って毎回レビューすること。
