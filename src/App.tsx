import { useState } from "react";
import "./App.css";
import KanbanBoard from "./components/kanban/KanbanBoard";
import ListView from "./components/list/ListView";
import MemberManager from "./components/member/MemberManager";
import TagManager from "./components/tag/TagManager";
import ColumnManager from "./components/kanban/ColumnManager";
import { AppHeader } from "./components/layout/AppHeader";
import { ActiveFiltersIndicator } from "./components/filter/ActiveFiltersIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";
import { ViewMode } from "./types";
import { useDueDateNotifications } from "./hooks/useDueDateNotifications";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // 期限通知フック
  useDueDateNotifications();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onOpenMemberManager={() => setShowMemberManager(true)}
        onOpenTagManager={() => setShowTagManager(true)}
        onOpenColumnManager={() => setShowColumnManager(true)}
      />

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
