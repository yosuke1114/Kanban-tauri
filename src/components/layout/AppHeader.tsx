import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { BoardSelector } from "@/components/board/BoardSelector";
import { Users, Tag, Columns, PlusCircle, Trash2, Settings } from "lucide-react";
import { useBoardStore, selectTrashCount } from "@/stores/useBoardStore";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { INPUT_LIMITS, validateInput } from "@/constants/validation";

interface AppHeaderProps {
  onOpenMemberManager: () => void;
  onOpenTagManager: () => void;
  onOpenColumnManager: () => void;
  onOpenTrashManager: () => void;
  onOpenBoardManager: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  taskInputRef?: React.RefObject<HTMLInputElement>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenMemberManager,
  onOpenTagManager,
  onOpenColumnManager,
  onOpenTrashManager,
  onOpenBoardManager,
  searchInputRef,
  taskInputRef,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskTitleError, setTaskTitleError] = useState<string | null>(null);
  const [isTaskPopoverOpen, setIsTaskPopoverOpen] = useState(false);
  const searchQuery = useBoardStore((state) => state.searchQuery);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
  const addTask = useBoardStore((state) => state.addTask);
  const trashCount = useBoardStore(selectTrashCount);

  const handleTaskTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTaskTitle(value);

    // リアルタイムバリデーション（文字数制限のみ）
    if (value.length > INPUT_LIMITS.TASK_TITLE) {
      setTaskTitleError(validateInput.maxLength(value, INPUT_LIMITS.TASK_TITLE));
    } else {
      setTaskTitleError(null);
    }
  }, []);

  const handleAddTask = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // バリデーション
      const error = validateInput.general(newTaskTitle, INPUT_LIMITS.TASK_TITLE);
      if (error) {
        setTaskTitleError(error);
        return;
      }

      addTask("todo", newTaskTitle.trim());
      setNewTaskTitle("");
      setTaskTitleError(null);
      setIsTaskPopoverOpen(false);
    },
    [newTaskTitle, addTask]
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60 shadow-apple">
      <div className="container mx-auto px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 shrink-0 min-w-0">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight truncate">
              Kanban Board
            </h1>
            <BoardSelector onOpenBoardManager={onOpenBoardManager} />
          </div>
          <div className="flex gap-1.5 md:gap-2 shrink-0">
            {/* タスク追加ポップオーバー */}
            <Popover open={isTaskPopoverOpen} onOpenChange={setIsTaskPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-lg transition-apple"
                >
                  <PlusCircle size={16} className="md:mr-2" />
                  <span className="hidden md:inline">タスク追加</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <form onSubmit={handleAddTask} className="space-y-2">
                  <div className="space-y-1">
                    <Input
                      ref={taskInputRef}
                      type="text"
                      data-testid="new-task-input"
                      value={newTaskTitle}
                      onChange={handleTaskTitleChange}
                      placeholder="新しいタスクを追加..."
                      className="w-full"
                      maxLength={INPUT_LIMITS.TASK_TITLE}
                      autoFocus
                    />
                    {taskTitleError && (
                      <p className="text-xs text-destructive">{taskTitleError}</p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      {newTaskTitle.length}/{INPUT_LIMITS.TASK_TITLE}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    data-testid="add-task-button"
                    className="w-full rounded-lg"
                    disabled={!!taskTitleError || !newTaskTitle.trim()}
                  >
                    追加
                  </Button>
                </form>
              </PopoverContent>
            </Popover>

            <FilterPanel />

            {/* 管理メニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-lg transition-apple"
                >
                  <Settings size={16} className="md:mr-2" />
                  <span className="hidden md:inline">管理</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={onOpenColumnManager}
                  data-testid="open-column-manager"
                  className="cursor-pointer"
                >
                  <Columns size={16} className="mr-2" />
                  列の管理
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onOpenMemberManager}
                  data-testid="open-member-manager"
                  className="cursor-pointer"
                >
                  <Users size={16} className="mr-2" />
                  メンバー管理
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onOpenTagManager}
                  data-testid="open-tag-manager"
                  className="cursor-pointer"
                >
                  <Tag size={16} className="mr-2" />
                  タグ管理
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ゴミ箱 */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTrashManager}
              className="rounded-lg transition-apple relative text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 size={16} />
              {trashCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 text-xs"
                >
                  {trashCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <SearchBar
          ref={searchInputRef}
          value={searchQuery}
          onChange={setSearchQuery}
          className="mt-3 md:mt-4"
        />
      </div>
    </header>
  );
};
