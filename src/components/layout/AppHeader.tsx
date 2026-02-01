import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { BoardSelector } from "@/components/board/BoardSelector";
import { Users, Tag, Columns, PlusCircle, User, Trash2 } from "lucide-react";
import { useBoardStore } from "@/stores/useBoardStore";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const searchQuery = useBoardStore((state) => state.searchQuery);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
  const addTask = useBoardStore((state) => state.addTask);
  const members = useBoardStore((state) => state.members);
  const currentUserId = useBoardStore((state) => state.currentUserId);
  const setCurrentUserId = useBoardStore((state) => state.setCurrentUserId);
  const toggleMyTasks = useBoardStore((state) => state.toggleMyTasks);
  const filters = useBoardStore((state) => state.filters);
  const getDeletedTasks = useBoardStore((state) => state.getDeletedTasks);
  const getArchivedTasks = useBoardStore((state) => state.getArchivedTasks);

  // 関数をコンポーネント内で呼び出す（セレクター内ではない）
  const deletedTasks = getDeletedTasks();
  const archivedTasks = getArchivedTasks();

  // 「自分のタスク」フィルターが有効かチェック
  const isMyTasksActive = currentUserId && filters.assigneeIds.includes(currentUserId);

  // ゴミ箱/アーカイブ内のタスク数
  const trashCount = deletedTasks.length + archivedTasks.length;

  const handleAddTask = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        addTask("todo", newTaskTitle);
        setNewTaskTitle("");
      }
    },
    [newTaskTitle, addTask]
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40 shadow-apple">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Kanban Board
            </h1>
            <BoardSelector onOpenBoardManager={onOpenBoardManager} />
          </div>
          <div className="flex gap-2 shrink-0">
            {/* 現在のユーザー選択 */}
            <Select
              value={currentUserId || "none"}
              onValueChange={(value) => setCurrentUserId(value === "none" ? undefined : value)}
            >
              <SelectTrigger className="w-[180px] rounded-lg">
                <SelectValue placeholder="ユーザーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未選択</SelectItem>
                {Object.values(members)
                  .filter((m) => m.isActive)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* 自分のタスクトグル */}
            <Button
              variant={isMyTasksActive ? "default" : "outline"}
              size="sm"
              onClick={toggleMyTasks}
              disabled={!currentUserId}
              className="rounded-lg hover:bg-muted transition-apple"
            >
              <User size={16} className="mr-2" />
              自分のタスク
            </Button>

            <FilterPanel />
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenColumnManager}
              className="rounded-lg hover:bg-muted transition-apple"
            >
              <Columns size={16} className="mr-2" />
              列の管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMemberManager}
              className="rounded-lg hover:bg-muted transition-apple"
            >
              <Users size={16} className="mr-2" />
              メンバー管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTagManager}
              className="rounded-lg hover:bg-muted transition-apple"
            >
              <Tag size={16} className="mr-2" />
              タグ管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTrashManager}
              className="rounded-lg hover:bg-muted transition-apple relative"
            >
              <Trash2 size={16} className="mr-2" />
              ゴミ箱
              {trashCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 text-xs"
                >
                  {trashCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="flex gap-2 mt-4">
          <Input
            ref={taskInputRef}
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="新しいタスクを追加..."
            className="flex-1 input-apple px-4 py-2.5"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl hover:scale-105 transition-apple"
          >
            <PlusCircle size={20} />
          </Button>
        </form>

        <SearchBar
          ref={searchInputRef}
          value={searchQuery}
          onChange={setSearchQuery}
          className="mt-3"
        />
      </div>
    </header>
  );
};
