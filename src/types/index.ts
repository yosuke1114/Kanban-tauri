// 型定義

export type Priority = "low" | "medium" | "high" | "urgent";

export type SyncStatus = "local" | "synced" | "conflict";

export type ViewMode = "kanban" | "list" | "calendar";

// タスクのライフサイクル状態
export type TaskStatus = "active" | "archived" | "deleted";

export type SortField = "title" | "priority" | "dueDate" | "createdAt";

export type SortDirection = "asc" | "desc";

export interface SyncMetadata {
  version: number;
  lastModifiedAt: string;
  syncStatus: SyncStatus;
}

export interface RecurrenceRule {
  type: "daily" | "weekly" | "monthly";
  interval: number;
  endDate?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  position: number;
  priority: Priority;
  dueDate?: string;
  assigneeIds: string[];
  tagIds: string[];
  recurrence?: RecurrenceRule;
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
  sync: SyncMetadata;
  // 論理削除対応（後方互換性のためオプショナル、undefinedは'active'として扱う）
  status?: TaskStatus;
  deletedAt?: string;  // 削除日時（自動削除用）
  archivedAt?: string; // アーカイブ日時
}

export interface Column {
  id: string;
  title: string;
  color: string;
  position: number;
  isDefault: boolean;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface FilterState {
  tagIds: string[];
  assigneeIds: string[];
  priorities: Priority[];
  dueDateRange?: {
    start: string;
    end: string;
  };
}

// 個別のボード（カンバン）
export interface Board {
  id: string;
  name: string;
  description?: string;
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  tags: { [key: string]: Tag }; // タグはボードごと
  createdAt: string;
  updatedAt: string;
}

// アプリケーション全体の状態
export interface AppState {
  boards: { [key: string]: Board };
  boardOrder: string[]; // ボードの表示順
  currentBoardId: string; // 現在選択中のボードID
  members: { [key: string]: Member }; // メンバーは全ボード共通
  currentUserId?: string; // 現在のユーザーID（「自分のタスク」フィルター用）
}

// 後方互換性のための既存インターフェース
export interface BoardState {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  members: { [key: string]: Member };
  tags: { [key: string]: Tag };
  filters: FilterState;
  currentUserId?: string; // 現在のユーザーID（「自分のタスク」フィルター用）
}
