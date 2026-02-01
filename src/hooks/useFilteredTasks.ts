import { useMemo } from "react";
import { useBoardStore, selectTasks } from "@/stores/useBoardStore";

export function useFilteredTasks() {
  const tasks = useBoardStore(selectTasks);
  const filters = useBoardStore((state) => state.filters);
  const searchQuery = useBoardStore((state) => state.searchQuery);

  return useMemo(() => {
    return Object.values(tasks).filter((task) => {
      // アクティブなタスクのみを対象（削除済み・アーカイブ済みを除外）
      const taskStatus = task.status || "active";
      if (taskStatus !== "active") return false;

      // 検索クエリフィルター
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description
          .toLowerCase()
          .includes(query);
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
  }, [tasks, filters, searchQuery]);
}
