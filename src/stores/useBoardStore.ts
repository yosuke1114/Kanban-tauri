import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Board, Task, Column, Member, Tag, FilterState } from "@/types";
import {
  calculateNextDueDate,
  isRecurrenceEnded,
} from "@/services/recurrence/recurrenceService";
import { storage } from "@/services/storage/tauriStorage";
import { toast } from "@/hooks/use-toast";

const DEFAULT_BOARD_ID = "default";

const createDefaultColumns = (): { [key: string]: Column } => ({
  todo: {
    id: "todo",
    title: "未着手",
    color: "#94a3b8",
    position: 0,
    isDefault: true,
  },
  inProgress: {
    id: "inProgress",
    title: "進行中",
    color: "#60a5fa",
    position: 1,
    isDefault: true,
  },
  done: {
    id: "done",
    title: "完了",
    color: "#34d399",
    position: 2,
    isDefault: true,
  },
});

const createDefaultBoard = (): Board => {
  const now = new Date().toISOString();
  return {
    id: DEFAULT_BOARD_ID,
    name: "メインボード",
    description: "",
    tasks: {},
    columns: createDefaultColumns(),
    columnOrder: ["todo", "inProgress", "done"],
    tags: {},
    createdAt: now,
    updatedAt: now,
  };
};

interface BoardStoreState {
  // マルチボード対応
  boards: { [key: string]: Board };
  boardOrder: string[];
  currentBoardId: string;

  // グローバル設定（全ボード共通）
  members: { [key: string]: Member };
  currentUserId?: string;

  // UIステート
  filters: FilterState;
  searchQuery: string;
}

const initialState: BoardStoreState = {
  boards: { [DEFAULT_BOARD_ID]: createDefaultBoard() },
  boardOrder: [DEFAULT_BOARD_ID],
  currentBoardId: DEFAULT_BOARD_ID,
  members: {},
  currentUserId: undefined,
  filters: {
    tagIds: [],
    assigneeIds: [],
    priorities: [],
  },
  searchQuery: "",
};

interface BoardStore extends BoardStoreState {
  // ボード操作
  addBoard: (name: string, description?: string) => string;
  updateBoard: (boardId: string, updates: Partial<Pick<Board, "name" | "description">>) => void;
  deleteBoard: (boardId: string) => void;
  duplicateBoard: (boardId: string) => string;
  switchBoard: (boardId: string) => void;
  reorderBoards: (newOrder: string[]) => void;
  getCurrentBoard: () => Board;

  // 現在のボードに対するタスク操作
  addTask: (columnId: string, title: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => void;

  // 論理削除操作
  archiveTask: (taskId: string) => void;
  archiveColumnTasks: (columnId: string) => void;
  softDeleteTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  permanentDeleteTask: (taskId: string) => void;
  getArchivedTasks: () => Task[];
  getDeletedTasks: () => Task[];
  emptyTrash: () => void;

  // 列操作
  addColumn: (title: string, color: string) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (newOrder: string[]) => void;

  // メンバー操作（グローバル）
  addMember: (name: string, color: string) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  deleteMember: (memberId: string) => void;

  // タグ操作（ボードごと）
  addTag: (name: string, color: string) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  deleteTag: (tagId: string) => void;

  // フィルター操作
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  getFilteredTasks: () => Task[];
  hasActiveFilters: () => boolean;

  // 検索操作
  setSearchQuery: (query: string) => void;

  // 現在のユーザー設定
  setCurrentUserId: (userId: string | undefined) => void;
  toggleMyTasks: () => void;

  // 繰り返しタスク
  generateRecurringTasks: () => void;

  // データ読み込み・保存
  loadFromStorage: () => void;
  saveToStorage: () => void;

  // 後方互換性のためのゲッター
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  tags: { [key: string]: Tag };
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  ...initialState,

  // 後方互換性のための計算プロパティ（初期値、実際の値はセレクターで取得）
  tasks: {},
  columns: {},
  columnOrder: [],
  tags: {},

  // ボード操作
  addBoard: (name: string, description?: string) => {
    const now = new Date().toISOString();
    const newBoard: Board = {
      id: uuidv4(),
      name,
      description: description || "",
      tasks: {},
      columns: createDefaultColumns(),
      columnOrder: ["todo", "inProgress", "done"],
      tags: {},
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      boards: { ...state.boards, [newBoard.id]: newBoard },
      boardOrder: [...state.boardOrder, newBoard.id],
      currentBoardId: newBoard.id,
    }));
    get().saveToStorage();
    toast({
      title: "ボードを作成しました",
      description: name,
    });
    return newBoard.id;
  },

  updateBoard: (boardId: string, updates: Partial<Pick<Board, "name" | "description">>) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;

      return {
        boards: {
          ...state.boards,
          [boardId]: {
            ...board,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    get().saveToStorage();
  },

  deleteBoard: (boardId: string) => {
    const state = get();
    // デフォルトボードは削除不可
    if (boardId === DEFAULT_BOARD_ID) {
      toast({
        title: "削除できません",
        description: "デフォルトボードは削除できません",
        variant: "destructive",
      });
      return;
    }
    // 最後の1つは削除不可
    if (state.boardOrder.length <= 1) {
      toast({
        title: "削除できません",
        description: "最低1つのボードが必要です",
        variant: "destructive",
      });
      return;
    }

    const boardName = state.boards[boardId]?.name;
    const newBoardOrder = state.boardOrder.filter((id) => id !== boardId);
    const newCurrentBoardId = boardId === state.currentBoardId
      ? newBoardOrder[0]
      : state.currentBoardId;

    set((state) => {
      const { [boardId]: _, ...remainingBoards } = state.boards;
      return {
        boards: remainingBoards,
        boardOrder: newBoardOrder,
        currentBoardId: newCurrentBoardId,
      };
    });
    get().saveToStorage();
    toast({
      title: "ボードを削除しました",
      description: boardName,
    });
  },

  duplicateBoard: (boardId: string) => {
    const state = get();
    const sourceBoard = state.boards[boardId];
    if (!sourceBoard) return "";

    const now = new Date().toISOString();
    const newBoard: Board = {
      ...sourceBoard,
      id: uuidv4(),
      name: `${sourceBoard.name} (コピー)`,
      createdAt: now,
      updatedAt: now,
      // タスクIDも新規に振り直す
      tasks: Object.fromEntries(
        Object.values(sourceBoard.tasks).map((task) => {
          const newId = uuidv4();
          return [newId, { ...task, id: newId }];
        })
      ),
    };

    set((state) => ({
      boards: { ...state.boards, [newBoard.id]: newBoard },
      boardOrder: [...state.boardOrder, newBoard.id],
      currentBoardId: newBoard.id,
    }));
    get().saveToStorage();
    toast({
      title: "ボードを複製しました",
      description: newBoard.name,
    });
    return newBoard.id;
  },

  switchBoard: (boardId: string) => {
    const state = get();
    if (!state.boards[boardId]) return;

    set({ currentBoardId: boardId });
    // フィルターをリセット
    set({
      filters: {
        tagIds: [],
        assigneeIds: [],
        priorities: [],
      },
      searchQuery: "",
    });
  },

  reorderBoards: (newOrder: string[]) => {
    set({ boardOrder: newOrder });
    get().saveToStorage();
  },

  getCurrentBoard: () => {
    const state = get();
    return state.boards[state.currentBoardId] || createDefaultBoard();
  },

  // タスク操作（現在のボードに対して）
  addTask: (columnId: string, title: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      title,
      description: "",
      columnId,
      position: Object.values(board.tasks).filter((t) => t.columnId === columnId).length,
      priority: "medium",
      assigneeIds: [],
      tagIds: [],
      createdAt: now,
      updatedAt: now,
      sync: {
        version: 1,
        lastModifiedAt: now,
        syncStatus: "local",
      },
    };

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: { ...board.tasks, [newTask.id]: newTask },
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
    toast({
      title: "タスクを作成しました",
      description: title,
    });
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    if (!task) return;

    const now = new Date().toISOString();
    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: {
            ...board.tasks,
            [taskId]: {
              ...task,
              ...updates,
              updatedAt: now,
              sync: {
                ...task.sync,
                version: task.sync.version + 1,
                lastModifiedAt: now,
              },
            },
          },
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
  },

  deleteTask: (taskId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    set((state) => {
      const { [taskId]: _, ...remainingTasks } = board.tasks;
      return {
        boards: {
          ...state.boards,
          [state.currentBoardId]: {
            ...board,
            tasks: remainingTasks,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    get().saveToStorage();
    if (task) {
      toast({
        title: "タスクを削除しました",
        description: task.title,
      });
    }
  },

  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    if (!task) return;

    const now = new Date().toISOString();
    const tasksInTargetColumn = Object.values(board.tasks)
      .filter((t) => t.columnId === targetColumnId && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const updatedTasks = { ...board.tasks };

    tasksInTargetColumn.forEach((t, index) => {
      const newPos = index >= newPosition ? index + 1 : index;
      if (t.position !== newPos) {
        updatedTasks[t.id] = { ...t, position: newPos, updatedAt: now };
      }
    });

    updatedTasks[taskId] = {
      ...task,
      columnId: targetColumnId,
      position: newPosition,
      updatedAt: now,
      sync: {
        ...task.sync,
        version: task.sync.version + 1,
        lastModifiedAt: now,
      },
    };

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: updatedTasks,
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
  },

  // 論理削除操作
  archiveTask: (taskId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    if (!task) return;

    const now = new Date().toISOString();
    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: {
            ...board.tasks,
            [taskId]: {
              ...task,
              status: "archived",
              archivedAt: now,
              updatedAt: now,
            },
          },
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
    toast({
      title: "タスクをアーカイブしました",
      description: task.title,
    });
  },

  archiveColumnTasks: (columnId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const column = board.columns[columnId];
    const columnTasks = Object.values(board.tasks).filter(
      (t) => t.columnId === columnId && (t.status === "active" || !t.status)
    );

    if (columnTasks.length === 0) return;

    const now = new Date().toISOString();
    const updatedTasks = { ...board.tasks };
    columnTasks.forEach((task) => {
      updatedTasks[task.id] = {
        ...task,
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      };
    });

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: updatedTasks,
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
    toast({
      title: `${columnTasks.length}件のタスクをアーカイブしました`,
      description: column?.title || columnId,
    });
  },

  softDeleteTask: (taskId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    if (!task) return;

    const now = new Date().toISOString();
    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: {
            ...board.tasks,
            [taskId]: {
              ...task,
              status: "deleted",
              deletedAt: now,
              updatedAt: now,
            },
          },
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
    toast({
      title: "タスクをゴミ箱に移動しました",
      description: `${task.title}（30日後に自動削除されます）`,
    });
  },

  restoreTask: (taskId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    if (!task) return;

    const now = new Date().toISOString();
    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: {
            ...board.tasks,
            [taskId]: {
              ...task,
              status: "active",
              deletedAt: undefined,
              archivedAt: undefined,
              updatedAt: now,
            },
          },
          updatedAt: now,
        },
      },
    }));
    get().saveToStorage();
    toast({
      title: "タスクを復元しました",
      description: task.title,
    });
  },

  permanentDeleteTask: (taskId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const task = board.tasks[taskId];
    set((state) => {
      const { [taskId]: _, ...remainingTasks } = board.tasks;
      return {
        boards: {
          ...state.boards,
          [state.currentBoardId]: {
            ...board,
            tasks: remainingTasks,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    get().saveToStorage();
    if (task) {
      toast({
        title: "タスクを完全に削除しました",
        description: task.title,
      });
    }
  },

  getArchivedTasks: () => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return [];
    return Object.values(board.tasks).filter((task) => task.status === "archived");
  },

  getDeletedTasks: () => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return [];
    return Object.values(board.tasks).filter((task) => task.status === "deleted");
  },

  emptyTrash: () => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const deletedTasks = Object.values(board.tasks).filter((task) => task.status === "deleted");
    if (deletedTasks.length === 0) return;

    const remainingTasks = { ...board.tasks };
    deletedTasks.forEach((task) => {
      delete remainingTasks[task.id];
    });

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: remainingTasks,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
    toast({
      title: "ゴミ箱を空にしました",
      description: `${deletedTasks.length}件のタスクを完全に削除しました`,
    });
  },

  // 列操作
  addColumn: (title: string, color: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const newColumn: Column = {
      id: uuidv4(),
      title,
      color,
      position: board.columnOrder.length,
      isDefault: false,
    };

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          columns: { ...board.columns, [newColumn.id]: newColumn },
          columnOrder: [...board.columnOrder, newColumn.id],
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  updateColumn: (columnId: string, updates: Partial<Column>) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          columns: {
            ...board.columns,
            [columnId]: { ...board.columns[columnId], ...updates },
          },
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  deleteColumn: (columnId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const { [columnId]: _, ...remainingColumns } = board.columns;
    const newColumnOrder = board.columnOrder.filter((id) => id !== columnId);

    const updatedTasks = { ...board.tasks };
    Object.keys(updatedTasks).forEach((taskId) => {
      if (updatedTasks[taskId].columnId === columnId) {
        delete updatedTasks[taskId];
      }
    });

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          columns: remainingColumns,
          columnOrder: newColumnOrder,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  reorderColumns: (newOrder: string[]) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          columnOrder: newOrder,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  // メンバー操作（グローバル）
  addMember: (name: string, color: string) => {
    const newMember: Member = {
      id: uuidv4(),
      name,
      color,
      isActive: true,
    };

    set((state) => ({
      members: { ...state.members, [newMember.id]: newMember },
    }));
    get().saveToStorage();
  },

  updateMember: (memberId: string, updates: Partial<Member>) => {
    set((state) => ({
      members: {
        ...state.members,
        [memberId]: { ...state.members[memberId], ...updates },
      },
    }));
    get().saveToStorage();
  },

  deleteMember: (memberId: string) => {
    set((state) => {
      const { [memberId]: _, ...remainingMembers } = state.members;

      // 全ボードのタスクから担当者を削除
      const updatedBoards = { ...state.boards };
      Object.keys(updatedBoards).forEach((boardId) => {
        const board = updatedBoards[boardId];
        const updatedTasks = { ...board.tasks };
        Object.keys(updatedTasks).forEach((taskId) => {
          updatedTasks[taskId] = {
            ...updatedTasks[taskId],
            assigneeIds: updatedTasks[taskId].assigneeIds.filter(
              (id) => id !== memberId
            ),
          };
        });
        updatedBoards[boardId] = { ...board, tasks: updatedTasks };
      });

      return { members: remainingMembers, boards: updatedBoards };
    });
    get().saveToStorage();
  },

  // タグ操作（ボードごと）
  addTag: (name: string, color: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const newTag: Tag = {
      id: uuidv4(),
      name,
      color,
    };

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tags: { ...board.tags, [newTag.id]: newTag },
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  updateTag: (tagId: string, updates: Partial<Tag>) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tags: {
            ...board.tags,
            [tagId]: { ...board.tags[tagId], ...updates },
          },
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  deleteTag: (tagId: string) => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const { [tagId]: _, ...remainingTags } = board.tags;

    const updatedTasks = { ...board.tasks };
    Object.keys(updatedTasks).forEach((taskId) => {
      updatedTasks[taskId] = {
        ...updatedTasks[taskId],
        tagIds: updatedTasks[taskId].tagIds.filter((id) => id !== tagId),
      };
    });

    set((state) => ({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tags: remainingTags,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    get().saveToStorage();
  },

  // フィルター操作
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        tagIds: [],
        assigneeIds: [],
        priorities: [],
      },
    });
  },

  getFilteredTasks: () => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return [];

    const { filters, searchQuery } = state;

    return Object.values(board.tasks).filter((task) => {
      // アクティブなタスクのみを対象
      const taskStatus = task.status || "active";
      if (taskStatus !== "active") return false;

      // 検索クエリフィルター
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // タグフィルター
      if (filters.tagIds.length > 0) {
        const hasMatchingTag = task.tagIds.some((tagId) =>
          filters.tagIds.includes(tagId)
        );
        if (!hasMatchingTag) return false;
      }

      // 担当者フィルター
      if (filters.assigneeIds.length > 0) {
        const hasMatchingAssignee = task.assigneeIds.some((assigneeId) =>
          filters.assigneeIds.includes(assigneeId)
        );
        if (!hasMatchingAssignee) return false;
      }

      // 優先度フィルター
      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(task.priority)) return false;
      }

      // 期限範囲フィルター
      if (filters.dueDateRange && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const start = new Date(filters.dueDateRange.start);
        const end = new Date(filters.dueDateRange.end);
        if (dueDate < start || dueDate > end) return false;
      }

      return true;
    });
  },

  hasActiveFilters: () => {
    const { filters, searchQuery } = get();
    return (
      filters.tagIds.length > 0 ||
      filters.assigneeIds.length > 0 ||
      filters.priorities.length > 0 ||
      !!filters.dueDateRange ||
      searchQuery.trim().length > 0
    );
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setCurrentUserId: (userId: string | undefined) => {
    set({ currentUserId: userId });
  },

  toggleMyTasks: () => {
    const { currentUserId, filters } = get();
    if (!currentUserId) return;

    if (filters.assigneeIds.includes(currentUserId)) {
      set((state) => ({
        filters: {
          ...state.filters,
          assigneeIds: state.filters.assigneeIds.filter((id) => id !== currentUserId),
        },
      }));
    } else {
      set((state) => ({
        filters: {
          ...state.filters,
          assigneeIds: [...state.filters.assigneeIds, currentUserId],
        },
      }));
    }
  },

  generateRecurringTasks: () => {
    const state = get();
    const board = state.boards[state.currentBoardId];
    if (!board) return;

    const now = new Date();
    const tasksToAdd: Task[] = [];

    Object.values(board.tasks).forEach((task) => {
      if (!task.recurrence || !task.dueDate) return;

      const dueDate = new Date(task.dueDate);
      if (dueDate < now && task.columnId === "done") {
        const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);

        if (isRecurrenceEnded(nextDueDate, task.recurrence)) {
          return;
        }

        const newTask: Task = {
          ...task,
          id: uuidv4(),
          dueDate: nextDueDate,
          columnId: "todo",
          position: Object.values(board.tasks).filter((t) => t.columnId === "todo").length,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          sync: {
            version: 1,
            lastModifiedAt: now.toISOString(),
            syncStatus: "local",
          },
        };

        tasksToAdd.push(newTask);
      }
    });

    if (tasksToAdd.length > 0) {
      const newTasks = { ...board.tasks };
      tasksToAdd.forEach((task) => {
        newTasks[task.id] = task;
      });

      set((state) => ({
        boards: {
          ...state.boards,
          [state.currentBoardId]: {
            ...board,
            tasks: newTasks,
            updatedAt: now.toISOString(),
          },
        },
      }));
      get().saveToStorage();
      toast({
        title: "繰り返しタスクを生成しました",
        description: `${tasksToAdd.length}件のタスクを追加しました`,
      });
    }
  },

  // データ読み込み・保存
  loadFromStorage: async () => {
    try {
      const savedState = await storage.load();
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // 新形式（マルチボード対応）の場合
        if (parsed.boards) {
          set({
            boards: parsed.boards,
            boardOrder: parsed.boardOrder || Object.keys(parsed.boards),
            currentBoardId: parsed.currentBoardId || Object.keys(parsed.boards)[0],
            members: parsed.members || {},
            currentUserId: parsed.currentUserId,
          });
        } else {
          // 旧形式からのマイグレーション
          const now = new Date().toISOString();
          const migratedBoard: Board = {
            id: DEFAULT_BOARD_ID,
            name: "メインボード",
            description: "",
            tasks: parsed.tasks || {},
            columns: parsed.columns || createDefaultColumns(),
            columnOrder: parsed.columnOrder || ["todo", "inProgress", "done"],
            tags: parsed.tags || {},
            createdAt: now,
            updatedAt: now,
          };

          set({
            boards: { [DEFAULT_BOARD_ID]: migratedBoard },
            boardOrder: [DEFAULT_BOARD_ID],
            currentBoardId: DEFAULT_BOARD_ID,
            members: parsed.members || {},
            currentUserId: parsed.currentUserId,
          });

          // マイグレーション後に保存
          get().saveToStorage();
          console.log("データを新形式にマイグレーションしました");
        }
      }
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error);
    }
  },

  saveToStorage: () => {
    const state = get();
    const dataToSave = {
      boards: state.boards,
      boardOrder: state.boardOrder,
      currentBoardId: state.currentBoardId,
      members: state.members,
      currentUserId: state.currentUserId,
    };
    storage.save(JSON.stringify(dataToSave)).catch((error) => {
      console.error("データの保存に失敗しました:", error);
    });
  },
}));

// セレクターヘルパー（現在のボードのデータにアクセスするため）
export const selectCurrentBoard = (state: BoardStoreState) => {
  return state.boards[state.currentBoardId];
};

export const selectTasks = (state: BoardStoreState) => {
  const board = state.boards[state.currentBoardId];
  return board?.tasks || {};
};

export const selectColumns = (state: BoardStoreState) => {
  const board = state.boards[state.currentBoardId];
  return board?.columns || {};
};

export const selectColumnOrder = (state: BoardStoreState) => {
  const board = state.boards[state.currentBoardId];
  return board?.columnOrder || [];
};

export const selectTags = (state: BoardStoreState) => {
  const board = state.boards[state.currentBoardId];
  return board?.tags || {};
};
