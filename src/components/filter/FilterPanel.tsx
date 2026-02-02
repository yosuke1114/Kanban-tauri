import { useMemo, useCallback } from "react";
import { useBoardStore, selectTags } from "@/stores/useBoardStore";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Priority } from "@/types";
import { PRIORITY_OPTIONS } from "@/constants/priority";

export function FilterPanel() {
  const filters = useBoardStore((state) => state.filters);
  const setFilters = useBoardStore((state) => state.setFilters);
  const clearFilters = useBoardStore((state) => state.clearFilters);
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore(selectTags);

  const activeMembers = useMemo(
    () => Object.values(members).filter((m) => m.isActive),
    [members]
  );

  const allTags = useMemo(() => Object.values(tags), [tags]);

  // フィルターがアクティブかどうかを直接計算
  const hasActiveFilters =
    filters.tagIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priorities.length > 0;

  const toggleTag = useCallback((tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];
    setFilters({ tagIds: newTagIds });
  }, [filters.tagIds, setFilters]);

  const toggleAssignee = useCallback((assigneeId: string) => {
    const newAssigneeIds = filters.assigneeIds.includes(assigneeId)
      ? filters.assigneeIds.filter((id) => id !== assigneeId)
      : [...filters.assigneeIds, assigneeId];
    setFilters({ assigneeIds: newAssigneeIds });
  }, [filters.assigneeIds, setFilters]);

  const togglePriority = useCallback((priority: Priority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    setFilters({ priorities: newPriorities });
  }, [filters.priorities, setFilters]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className="relative rounded-lg transition-apple"
        >
          <Filter size={16} className="mr-2" />
          フィルター
          {hasActiveFilters && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-semibold text-primary">
              {filters.tagIds.length +
                filters.assigneeIds.length +
                filters.priorities.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">フィルター</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs"
              >
                <X size={14} className="mr-1" />
                クリア
              </Button>
            )}
          </div>

          <Separator />

          {/* タグフィルター */}
          <div>
            <label className="text-sm font-medium mb-2 block">タグ</label>
            {allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                タグがありません
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      filters.tagIds.includes(tag.id)
                        ? "ring-2 ring-primary"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: tag.color,
                      color: "#fff",
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 担当者フィルター */}
          <div>
            <label className="text-sm font-medium mb-2 block">担当者</label>
            {activeMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                メンバーがいません
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(member.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filters.assigneeIds.includes(member.id)
                        ? "ring-2 ring-primary"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: member.color,
                      color: "#fff",
                    }}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 優先度フィルター */}
          <div>
            <label className="text-sm font-medium mb-2 block">優先度</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => togglePriority(value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    filters.priorities.includes(value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
