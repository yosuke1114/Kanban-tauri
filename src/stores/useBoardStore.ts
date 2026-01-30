import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { BoardState, Task, Column, Member, Tag } from "@/types";
import {
  calculateNextDueDate,
  isRecurrenceEnded,
} from "@/services/recurrence/recurrenceService";
import { storage } from "@/services/storage/tauriStorage";

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

const initialState: BoardState = {
  tasks: {},
  columns: createDefaultColumns(),
  columnOrder: ["todo", "inProgress", "done"],
  members: {},
  tags: {},
  filters: {
    tagIds: [],
    assigneeIds: [],
    priorities: [],
  },
};

interface BoardStore extends BoardState {
  // タスク操作
  addTask: (columnId: string, title: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => void;

  // 列操作
  addColumn: (title: string, color: string) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (newOrder: string[]) => void;

  // メンバー操作
  addMember: (name: string, color: string) => void;
  updateMember: (memberId: string, updates: Partial<Member>) => void;
  deleteMember: (memberId: string) => void;

  // タグ操作
  addTag: (name: string, color: string) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  deleteTag: (tagId: string) => void;

  // フィルター操作
  setFilters: (filters: Partial<BoardState["filters"]>) => void;
  clearFilters: () => void;
  getFilteredTasks: () => Task[];
  hasActiveFilters: () => boolean;

  // 繰り返しタスク
  generateRecurringTasks: () => void;

  // データ読み込み・保存
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  ...initialState,

  // タスク操作
  addTask: (columnId: string, title: string) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      title,
      description: "",
      columnId,
      position: Object.values(get().tasks).filter((t) => t.columnId === columnId)
        .length,
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
      tasks: { ...state.tasks, [newTask.id]: newTask },
    }));
    get().saveToStorage();
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      const now = new Date().toISOString();
      return {
        tasks: {
          ...state.tasks,
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
      };
    });
    get().saveToStorage();
  },

  deleteTask: (taskId: string) => {
    set((state) => {
      const { [taskId]: _, ...remainingTasks } = state.tasks;
      return { tasks: remainingTasks };
    });
    get().saveToStorage();
  },

  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      const now = new Date().toISOString();
      const tasksInTargetColumn = Object.values(state.tasks)
        .filter((t) => t.columnId === targetColumnId && t.id !== taskId)
        .sort((a, b) => a.position - b.position);

      const updatedTasks = { ...state.tasks };

      // 既存のタスクの位置を調整
      tasksInTargetColumn.forEach((t, index) => {
        const newPos = index >= newPosition ? index + 1 : index;
        if (t.position !== newPos) {
          updatedTasks[t.id] = { ...t, position: newPos, updatedAt: now };
        }
      });

      // 移動するタスクを更新
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

      return { tasks: updatedTasks };
    });
    get().saveToStorage();
  },

  // 列操作
  addColumn: (title: string, color: string) => {
    const newColumn: Column = {
      id: uuidv4(),
      title,
      color,
      position: get().columnOrder.length,
      isDefault: false,
    };

    set((state) => ({
      columns: { ...state.columns, [newColumn.id]: newColumn },
      columnOrder: [...state.columnOrder, newColumn.id],
    }));
    get().saveToStorage();
  },

  updateColumn: (columnId: string, updates: Partial<Column>) => {
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: { ...state.columns[columnId], ...updates },
      },
    }));
    get().saveToStorage();
  },

  deleteColumn: (columnId: string) => {
    const column = get().columns[columnId];
    if (column?.isDefault) {
      console.warn("デフォルト列は削除できません");
      return;
    }

    set((state) => {
      const { [columnId]: _, ...remainingColumns } = state.columns;
      const newColumnOrder = state.columnOrder.filter((id) => id !== columnId);

      // この列のタスクを削除
      const updatedTasks = { ...state.tasks };
      Object.keys(updatedTasks).forEach((taskId) => {
        if (updatedTasks[taskId].columnId === columnId) {
          delete updatedTasks[taskId];
        }
      });

      return {
        columns: remainingColumns,
        columnOrder: newColumnOrder,
        tasks: updatedTasks,
      };
    });
    get().saveToStorage();
  },

  reorderColumns: (newOrder: string[]) => {
    set({ columnOrder: newOrder });
    get().saveToStorage();
  },

  // メンバー操作
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

      // タスクから担当者を削除
      const updatedTasks = { ...state.tasks };
      Object.keys(updatedTasks).forEach((taskId) => {
        updatedTasks[taskId] = {
          ...updatedTasks[taskId],
          assigneeIds: updatedTasks[taskId].assigneeIds.filter(
            (id) => id !== memberId
          ),
        };
      });

      return { members: remainingMembers, tasks: updatedTasks };
    });
    get().saveToStorage();
  },

  // タグ操作
  addTag: (name: string, color: string) => {
    const newTag: Tag = {
      id: uuidv4(),
      name,
      color,
    };

    set((state) => ({
      tags: { ...state.tags, [newTag.id]: newTag },
    }));
    get().saveToStorage();
  },

  updateTag: (tagId: string, updates: Partial<Tag>) => {
    set((state) => ({
      tags: {
        ...state.tags,
        [tagId]: { ...state.tags[tagId], ...updates },
      },
    }));
    get().saveToStorage();
  },

  deleteTag: (tagId: string) => {
    set((state) => {
      const { [tagId]: _, ...remainingTags } = state.tags;

      // タスクからタグを削除
      const updatedTasks = { ...state.tasks };
      Object.keys(updatedTasks).forEach((taskId) => {
        updatedTasks[taskId] = {
          ...updatedTasks[taskId],
          tagIds: updatedTasks[taskId].tagIds.filter((id) => id !== tagId),
        };
      });

      return { tags: remainingTags, tasks: updatedTasks };
    });
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
    const { tasks, filters } = state;

    return Object.values(tasks).filter((task) => {
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
    const { filters } = get();
    return (
      filters.tagIds.length > 0 ||
      filters.assigneeIds.length > 0 ||
      filters.priorities.length > 0 ||
      !!filters.dueDateRange
    );
  },

  generateRecurringTasks: () => {
    const state = get();
    const now = new Date();
    const tasksToAdd: Task[] = [];

    Object.values(state.tasks).forEach((task) => {
      if (!task.recurrence || !task.dueDate) return;

      const dueDate = new Date(task.dueDate);
      // 期限が過去で、かつ完了列にある場合、次の繰り返しタスクを生成
      if (dueDate < now && task.columnId === "done") {
        const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);

        // 繰り返し終了チェック
        if (isRecurrenceEnded(nextDueDate, task.recurrence)) {
          return;
        }

        const newTask: Task = {
          ...task,
          id: uuidv4(),
          dueDate: nextDueDate,
          columnId: "todo", // 未着手に戻す
          position: Object.values(state.tasks).filter((t) => t.columnId === "todo")
            .length,
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
      set((state) => {
        const newTasks = { ...state.tasks };
        tasksToAdd.forEach((task) => {
          newTasks[task.id] = task;
        });
        return { tasks: newTasks };
      });
      get().saveToStorage();
    }
  },

  // データ読み込み・保存
  loadFromStorage: async () => {
    try {
      const savedState = await storage.load();
      if (savedState) {
        const parsed = JSON.parse(savedState);
        set({
          tasks: parsed.tasks || {},
          columns: parsed.columns || createDefaultColumns(),
          columnOrder: parsed.columnOrder || ["todo", "inProgress", "done"],
          members: parsed.members || {},
          tags: parsed.tags || {},
        });
      }
    } catch (error) {
      console.error("データの読み込みに失敗しました:", error);
    }
  },

  saveToStorage: () => {
    const state = get();
    const dataToSave = {
      tasks: state.tasks,
      columns: state.columns,
      columnOrder: state.columnOrder,
      members: state.members,
      tags: state.tags,
    };
    // 非同期保存（fire-and-forget）
    storage.save(JSON.stringify(dataToSave)).catch((error) => {
      console.error("データの保存に失敗しました:", error);
    });
  },
}));
