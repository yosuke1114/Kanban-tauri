import { useState, useRef, lazy, Suspense } from "react";
import "./App.css";
import KanbanBoard from "./components/kanban/KanbanBoard";
import ListView from "./components/list/ListView";
import { AppHeader } from "./components/layout/AppHeader";
import { ActiveFiltersIndicator } from "./components/filter/ActiveFiltersIndicator";
import { SrAnnouncer } from "./components/ui/sr-announcer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";
import { ViewMode } from "./types";
import { useDueDateNotifications } from "./hooks/useDueDateNotifications";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useBoardStore } from "./stores/useBoardStore";
import { Toaster } from "./components/ui/toaster";

// ダイアログコンポーネントを遅延読み込み（パフォーマンス最適化）
const MemberManager = lazy(() => import("./components/member/MemberManager"));
const TagManager = lazy(() => import("./components/tag/TagManager"));
const ColumnManager = lazy(() => import("./components/kanban/ColumnManager"));
const ShortcutsDialog = lazy(() => import("./components/shortcuts/ShortcutsDialog").then(m => ({ default: m.ShortcutsDialog })));

function App() {
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const clearFilters = useBoardStore((state) => state.clearFilters);

  // 期限通知フック
  useDueDateNotifications();

  // キーボードショートカット
  useKeyboardShortcuts({
    onSearch: () => {
      searchInputRef.current?.focus();
    },
    onNewTask: () => {
      taskInputRef.current?.focus();
    },
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
      {/* スキップリンク（キーボードナビゲーション用） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg"
      >
        メインコンテンツへスキップ
      </a>

      {/* スクリーンリーダー向け通知 */}
      <SrAnnouncer />

      <AppHeader
        onOpenMemberManager={() => setShowMemberManager(true)}
        onOpenTagManager={() => setShowTagManager(true)}
        onOpenColumnManager={() => setShowColumnManager(true)}
        searchInputRef={searchInputRef}
        taskInputRef={taskInputRef}
      />

      <ActiveFiltersIndicator />

      <main id="main-content" className="flex-1 flex flex-col overflow-hidden">
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
            </TabsList>
          </div>
          <TabsContent value="kanban" className="mt-0 flex-1 overflow-hidden">
            <KanbanBoard />
          </TabsContent>
          <TabsContent value="list" className="mt-0 flex-1 overflow-hidden">
            <ListView />
          </TabsContent>
        </Tabs>
      </main>

      {/* 遅延読み込みされるダイアログ */}
      <Suspense fallback={null}>
        {showColumnManager && (
          <ColumnManager
            open={showColumnManager}
            onClose={() => setShowColumnManager(false)}
          />
        )}
        {showMemberManager && (
          <MemberManager
            open={showMemberManager}
            onClose={() => setShowMemberManager(false)}
          />
        )}
        {showTagManager && (
          <TagManager
            open={showTagManager}
            onClose={() => setShowTagManager(false)}
          />
        )}
        {showShortcuts && (
          <ShortcutsDialog
            open={showShortcuts}
            onClose={() => setShowShortcuts(false)}
          />
        )}
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
