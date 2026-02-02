import React, { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { BoardSelector } from "@/components/board/BoardSelector";
import { Users, Tag, Columns, PlusCircle, Trash2, Settings, Database } from "lucide-react";

// 動的インポート：使用頻度が低い設定ダイアログ
const DataStorageSettings = lazy(() => import("@/components/settings/DataStorageSettings").then(m => ({ default: m.DataStorageSettings })));
import { useBoardStore, selectTrashCount } from "@/stores/useBoardStore";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onOpenMemberManager: () => void;
  onOpenTagManager: () => void;
  onOpenColumnManager: () => void;
  onOpenTrashManager: () => void;
  onOpenBoardManager: () => void;
  onAddNewTask: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenMemberManager,
  onOpenTagManager,
  onOpenColumnManager,
  onOpenTrashManager,
  onOpenBoardManager,
  onAddNewTask,
  searchInputRef,
}) => {
  const [isStorageSettingsOpen, setIsStorageSettingsOpen] = useState(false);
  const searchQuery = useBoardStore((state) => state.searchQuery);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
  const trashCount = useBoardStore(selectTrashCount);

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
            {/* タスク追加ボタン */}
            <Button
              variant="default"
              size="sm"
              className="rounded-lg transition-apple"
              onClick={onAddNewTask}
              data-testid="add-task-button"
            >
              <PlusCircle size={16} className="md:mr-2" />
              <span className="hidden md:inline">タスク追加</span>
            </Button>

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
                <DropdownMenuItem
                  onClick={() => setIsStorageSettingsOpen(true)}
                  data-testid="open-storage-settings"
                  className="cursor-pointer"
                >
                  <Database size={16} className="mr-2" />
                  データ保存設定
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

      {isStorageSettingsOpen && (
        <Suspense fallback={null}>
          <DataStorageSettings
            open={isStorageSettingsOpen}
            onClose={() => setIsStorageSettingsOpen(false)}
          />
        </Suspense>
      )}
    </header>
  );
};
