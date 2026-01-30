import { useState } from "react";
import "./App.css";
import KanbanBoard from "./components/kanban/KanbanBoard";
import ListView from "./components/list/ListView";
import MemberManager from "./components/member/MemberManager";
import TagManager from "./components/tag/TagManager";
import ColumnManager from "./components/kanban/ColumnManager";
import { FilterPanel } from "./components/filter/FilterPanel";
import { ActiveFiltersIndicator } from "./components/filter/ActiveFiltersIndicator";
import SearchBar from "./components/search/SearchBar";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Users, Tag, Columns, LayoutGrid, List } from "lucide-react";
import { ViewMode } from "./types";
import { useDueDateNotifications } from "./hooks/useDueDateNotifications";
import { useBoardStore } from "./stores/useBoardStore";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const searchQuery = useBoardStore((state) => state.searchQuery);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);

  // 期限通知フック
  useDueDateNotifications();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold shrink-0">Kanban Board</h1>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              className="hidden md:block flex-1 max-w-md mx-auto"
            />
            <div className="flex gap-2 shrink-0">
              <FilterPanel />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnManager(true)}
              >
                <Columns size={16} className="mr-2" />
                列の管理
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMemberManager(true)}
              >
                <Users size={16} className="mr-2" />
                メンバー管理
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagManager(true)}
              >
                <Tag size={16} className="mr-2" />
                タグ管理
              </Button>
            </div>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="md:hidden mt-3"
          />
        </div>
      </header>

      <ActiveFiltersIndicator />

      <main>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <div className="container mx-auto px-4 pt-4">
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid size={16} />
                カンバンビュー
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List size={16} />
                リストビュー
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="kanban" className="mt-0">
            <KanbanBoard />
          </TabsContent>
          <TabsContent value="list" className="mt-0">
            <ListView />
          </TabsContent>
        </Tabs>
      </main>

      <ColumnManager
        open={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />
      <MemberManager
        open={showMemberManager}
        onClose={() => setShowMemberManager(false)}
      />
      <TagManager
        open={showTagManager}
        onClose={() => setShowTagManager(false)}
      />
      <Toaster />
    </div>
  );
}

export default App;
