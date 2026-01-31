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
import { useBoardStore } from "@/stores/useBoardStore";
import { useFilteredTasks } from "@/hooks/useFilteredTasks";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Task } from "@/types";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "../task/TaskCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KanbanBoard: React.FC = () => {
  const tasks = useBoardStore((state) => state.tasks);
  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
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

  // レスポンシブ対応: モバイル判定
  const isMobile = useIsMobile();

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
      {/* モバイル: カラムセレクター */}
      <div className="md:hidden mb-4">
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
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto overflow-y-hidden pb-4 flex-1 min-h-0 md:snap-x md:snap-mandatory lg:snap-none scroll-smooth">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            if (!column) return null;

            // モバイル: アクティブカラムのみ表示
            // デスクトップ: すべて表示（横スクロール可能）
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
                <KanbanColumn column={column} tasks={columnTasks} />
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
