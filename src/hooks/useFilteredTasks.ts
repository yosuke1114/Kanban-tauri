import { useMemo } from "react";
import { useBoardStore } from "@/stores/useBoardStore";

export function useFilteredTasks() {
  const tasks = useBoardStore((state) => state.tasks);
  const filters = useBoardStore((state) => state.filters);

  const allTasks = useMemo(() => Object.values(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (filters.tagIds.length > 0) {
        const hasMatchingTag = task.tagIds.some((tagId) =>
          filters.tagIds.includes(tagId)
        );
        if (!hasMatchingTag) return false;
      }

      if (filters.assigneeIds.length > 0) {
        const hasMatchingAssignee = task.assigneeIds.some((assigneeId) =>
          filters.assigneeIds.includes(assigneeId)
        );
        if (!hasMatchingAssignee) return false;
      }

      if (filters.priorities.length > 0) {
        if (!filters.priorities.includes(task.priority)) return false;
      }

      return true;
    });
  }, [allTasks, filters]);

  return filteredTasks;
}
