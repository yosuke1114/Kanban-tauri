// 型定義

export type Priority = "low" | "medium" | "high" | "urgent";

export type SyncStatus = "local" | "synced" | "conflict";

export type ViewMode = "kanban" | "list";

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
  createdAt: string;
  updatedAt: string;
  sync: SyncMetadata;
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

export interface BoardState {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  members: { [key: string]: Member };
  tags: { [key: string]: Tag };
  filters: FilterState;
  currentUserId?: string; // 現在のユーザーID（「自分のタスク」フィルター用）
}
