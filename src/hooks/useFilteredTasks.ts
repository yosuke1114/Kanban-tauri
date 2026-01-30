import { useBoardStore } from "@/stores/useBoardStore";

export function useFilteredTasks() {
  // ストアのgetFilteredTasksメソッドを直接使用
  return useBoardStore((state) => state.getFilteredTasks());
}
