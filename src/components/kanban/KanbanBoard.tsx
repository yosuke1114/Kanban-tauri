import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoardStore, selectTasks, selectColumns, selectColumnOrder } from "@/stores/useBoardStore";
import { useFilteredTasks } from "@/hooks/useFilteredTasks";
import { useViewportSize } from "@/hooks/useMediaQuery";
import { useSwipe } from "@/hooks/useSwipe";
import { Task } from "@/types";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "../task/TaskCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KanbanBoard: React.FC = () => {
  const tasks = useBoardStore(selectTasks);
  const columns = useBoardStore(selectColumns);
  const columnOrder = useBoardStore(selectColumnOrder);
  const moveTask = useBoardStore((state) => state.moveTask);
  const loadFromStorage = useBoardStore((state) => state.loadFromStorage);
  const generateRecurringTasks = useBoardStore(
    (state) => state.generateRecurringTasks
  );

  const filteredTasks = useFilteredTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string>(
    columnOrder[0] || ""
  );

  // レスポンシブ対応: ビューポートサイズ判定
  const viewportSize = useViewportSize();
  const isMobile = viewportSize === "mobile";

  // スワイプでカラム切り替え（モバイルのみ）
  const handleSwipeLeft = useCallback(() => {
    if (!isMobile) return;
    const currentIndex = columnOrder.indexOf(activeColumnId);
    if (currentIndex < columnOrder.length - 1) {
      setActiveColumnId(columnOrder[currentIndex + 1]);
    }
  }, [columnOrder, activeColumnId, isMobile]);

  const handleSwipeRight = useCallback(() => {
    if (!isMobile) return;
    const currentIndex = columnOrder.indexOf(activeColumnId);
    if (currentIndex > 0) {
      setActiveColumnId(columnOrder[currentIndex - 1]);
    }
  }, [columnOrder, activeColumnId, isMobile]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
  });

  // 現在のカラムインデックス（モバイル表示用）
  const currentColumnIndex = columnOrder.indexOf(activeColumnId);
  const canGoLeft = currentColumnIndex > 0;
  const canGoRight = currentColumnIndex < columnOrder.length - 1;

  // カラムごとのタスク数を計算
  const columnTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    columnOrder.forEach((columnId) => {
      counts[columnId] = filteredTasks.filter(
        (task) => task.columnId === columnId
      ).length;
    });
    return counts;
  }, [columnOrder, filteredTasks]);

  useEffect(() => {
    const initializeData = async () => {
      await loadFromStorage();
      // データ読み込み後、繰り返しタスクを生成
      generateRecurringTasks();
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveTask(tasks[active.id as string] || null);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeTask = tasks[activeId];
      if (!activeTask) return;

      // 列の上にドロップした場合
      if (columns[overId]) {
        const targetColumnId = overId;
        const tasksInColumn = filteredTasks.filter(
          (t) => t.columnId === targetColumnId
        );
        moveTask(activeId, targetColumnId, tasksInColumn.length);
        return;
      }

      // タスクの上にドロップした場合
      const overTask = tasks[overId];
      if (overTask) {
        moveTask(activeId, overTask.columnId, overTask.position);
      }
    },
    [tasks, columns, filteredTasks, moveTask]
  );

  return (
    <div className="w-full h-full p-4 overflow-hidden flex flex-col">
      {/* モバイル: カラムセレクター + ナビゲーション */}
      {isMobile && (
        <div className="mb-4 space-y-2">
          <Select value={activeColumnId} onValueChange={setActiveColumnId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columnOrder.map((columnId) => {
                const column = columns[columnId];
                if (!column) return null;
                return (
                  <SelectItem key={columnId} value={columnId}>
                    {column.title} ({columnTaskCounts[columnId] || 0})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {/* スワイプインジケーター */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handleSwipeRight}
              disabled={!canGoLeft}
              className="p-2 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="前のカラム"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1.5">
              {columnOrder.map((columnId, index) => (
                <button
                  key={columnId}
                  onClick={() => setActiveColumnId(columnId)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentColumnIndex
                      ? "bg-primary w-4"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`カラム ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleSwipeLeft}
              disabled={!canGoRight}
              className="p-2 rounded-full hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="次のカラム"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            左右にスワイプしてカラムを切り替え
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`
            gap-4 overflow-y-hidden pb-4 flex-1 min-h-0 scroll-smooth
            ${viewportSize === "mobile" ? "flex flex-col" : ""}
            ${viewportSize === "tablet" ? "flex flex-row overflow-x-auto snap-x snap-mandatory" : ""}
            ${viewportSize === "desktop" ? "flex flex-row overflow-x-auto" : ""}
          `}
          {...(isMobile ? swipeHandlers : {})}
        >
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            if (!column) return null;

            // モバイル: アクティブカラムのみ表示
            // タブレット/デスクトップ: すべて表示（横スクロール可能）
            const isVisible = !isMobile || columnId === activeColumnId;

            if (!isVisible) return null;

            const columnTasks = filteredTasks
              .filter((task) => task.columnId === columnId)
              .sort((a, b) => a.position - b.position);

            return (
              <SortableContext
                key={columnId}
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  column={column}
                  tasks={columnTasks}
                  viewportSize={viewportSize}
                />
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
