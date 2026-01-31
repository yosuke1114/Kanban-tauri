import { useBoardStore, selectTags } from "@/stores/useBoardStore";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Priority } from "@/types";

export function ActiveFiltersIndicator() {
  const filters = useBoardStore((state) => state.filters);
  const setFilters = useBoardStore((state) => state.setFilters);
  const clearFilters = useBoardStore((state) => state.clearFilters);
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore(selectTags);

  // フィルターがアクティブかどうかを直接計算
  const hasActiveFilters =
    filters.tagIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  const priorityLabels: Record<Priority, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "緊急",
  };

  const removeTag = (tagId: string) => {
    setFilters({ tagIds: filters.tagIds.filter((id) => id !== tagId) });
  };

  const removeAssignee = (assigneeId: string) => {
    setFilters({
      assigneeIds: filters.assigneeIds.filter((id) => id !== assigneeId),
    });
  };

  const removePriority = (priority: Priority) => {
    setFilters({
      priorities: filters.priorities.filter((p) => p !== priority),
    });
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b">
      <span className="text-sm font-medium text-muted-foreground">
        アクティブなフィルター:
      </span>
      <div className="flex flex-wrap gap-2 flex-1">
        {filters.tagIds.map((tagId) => {
          const tag = tags[tagId];
          if (!tag) return null;
          return (
            <button
              key={tagId}
              onClick={() => removeTag(tagId)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium group hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: tag.color,
                color: "#fff",
              }}
            >
              {tag.name}
              <X size={12} className="group-hover:scale-110 transition-transform" />
            </button>
          );
        })}
        {filters.assigneeIds.map((assigneeId) => {
          const member = members[assigneeId];
          if (!member) return null;
          return (
            <button
              key={assigneeId}
              onClick={() => removeAssignee(assigneeId)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium group hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: member.color,
                color: "#fff",
              }}
            >
              {member.name}
              <X size={12} className="group-hover:scale-110 transition-transform" />
            </button>
          );
        })}
        {filters.priorities.map((priority) => (
          <button
            key={priority}
            onClick={() => removePriority(priority)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium group hover:opacity-80 transition-opacity"
          >
            {priorityLabels[priority]}
            <X size={12} className="group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={clearFilters}
        className="h-7 px-2 text-xs"
      >
        すべてクリア
      </Button>
    </div>
  );
}
