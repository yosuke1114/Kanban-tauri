import { useState, useRef, lazy, Suspense } from "react";
import "./App.css";
import KanbanBoard from "./components/kanban/KanbanBoard";
import ListView from "./components/list/ListView";
import MemberManager from "./components/member/MemberManager";
import TagManager from "./components/tag/TagManager";
import ColumnManager from "./components/kanban/ColumnManager";
import TrashManager from "./components/task/TrashManager";
import { BoardManagerDialog } from "./components/board/BoardManagerDialog";
import { AppHeader } from "./components/layout/AppHeader";
import { ActiveFiltersIndicator } from "./components/filter/ActiveFiltersIndicator";
import { ShortcutsDialog } from "./components/shortcuts/ShortcutsDialog";
import EditTaskDialog from "./components/task/EditTaskDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { LayoutGrid, List, Calendar } from "lucide-react";
import { ViewMode } from "./types";
import { useDueDateNotifications } from "./hooks/useDueDateNotifications";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useBoardStore } from "./stores/useBoardStore";
import { Toaster } from "./components/ui/toaster";

// 動的インポート：使用頻度が低い大きなコンポーネント
const CalendarView = lazy(() => import("./components/calendar/CalendarView"));

function App() {
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showTrashManager, setShowTrashManager] = useState(false);
  const [showBoardManager, setShowBoardManager] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const clearFilters = useBoardStore((state) => state.clearFilters);
  const addTask = useBoardStore((state) => state.addTask);
  const tasks = useBoardStore((state) => state.boards[state.currentBoardId]?.tasks || {});

  const handleAddNewTask = () => {
    // デフォルトの「todo」列に空タスクを作成（トーストは表示しない）
    const taskId = addTask("todo", "新しいタスク", false);
    if (taskId) {
      setNewTaskId(taskId);
    }
  };

  // 期限通知フック
  useDueDateNotifications();

  // キーボードショートカット
  useKeyboardShortcuts({
    onSearch: () => {
      searchInputRef.current?.focus();
    },
    onNewTask: handleAddNewTask,
    onShowShortcuts: () => {
      setShowShortcuts(true);
    },
    onSwitchToKanban: () => {
      setViewMode("kanban");
    },
    onSwitchToList: () => {
      setViewMode("list");
    },
    onOpenMembers: () => {
      setShowMemberManager(true);
    },
    onOpenTags: () => {
      setShowTagManager(true);
    },
    onOpenColumns: () => {
      setShowColumnManager(true);
    },
    onClearFilters: () => {
      clearFilters();
    },
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AppHeader
        onOpenMemberManager={() => setShowMemberManager(true)}
        onOpenTagManager={() => setShowTagManager(true)}
        onOpenColumnManager={() => setShowColumnManager(true)}
        onOpenTrashManager={() => setShowTrashManager(true)}
        onOpenBoardManager={() => setShowBoardManager(true)}
        onAddNewTask={handleAddNewTask}
        searchInputRef={searchInputRef}
      />

      <ActiveFiltersIndicator />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 flex-shrink-0">
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid size={16} />
                カンバンビュー
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List size={16} />
                リストビュー
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar size={16} />
                カレンダービュー
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="kanban" className="mt-0 flex-1 overflow-hidden">
            <KanbanBoard />
          </TabsContent>
          <TabsContent value="list" className="mt-0 flex-1 overflow-hidden">
            <ListView />
          </TabsContent>
          <TabsContent value="calendar" className="mt-0 flex-1 overflow-hidden">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">カレンダーを読み込み中...</div>
              </div>
            }>
              <CalendarView />
            </Suspense>
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
      <ShortcutsDialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <TrashManager
        open={showTrashManager}
        onClose={() => setShowTrashManager(false)}
      />
      <BoardManagerDialog
        open={showBoardManager}
        onOpenChange={setShowBoardManager}
      />
      {newTaskId && tasks[newTaskId] && (
        <EditTaskDialog
          task={tasks[newTaskId]}
          open={true}
          onClose={() => setNewTaskId(null)}
          isNewTask={true}
        />
      )}
      <Toaster />
    </div>
  );
}

export default App;
