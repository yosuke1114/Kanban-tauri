import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { Users, Tag, Columns, PlusCircle } from "lucide-react";
import { useBoardStore } from "@/stores/useBoardStore";

interface AppHeaderProps {
  onOpenMemberManager: () => void;
  onOpenTagManager: () => void;
  onOpenColumnManager: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenMemberManager,
  onOpenTagManager,
  onOpenColumnManager,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const searchQuery = useBoardStore((state) => state.searchQuery);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
  const addTask = useBoardStore((state) => state.addTask);

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
          <h1 className="text-2xl font-semibold tracking-tight shrink-0">
            Kanban Board
          </h1>
          <div className="flex gap-2 shrink-0">
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
          </div>
        </div>

        <form onSubmit={handleAddTask} className="flex gap-2 mt-4">
          <Input
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
          value={searchQuery}
          onChange={setSearchQuery}
          className="mt-3"
        />
      </div>
    </header>
  );
};
