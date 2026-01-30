import React, { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoardStore } from "@/stores/useBoardStore";
import { useFilteredTasks } from "@/hooks/useFilteredTasks";
import { Task } from "@/types";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "../task/TaskCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const KanbanBoard: React.FC = () => {
  const tasks = useBoardStore((state) => state.tasks);
  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
  const addTask = useBoardStore((state) => state.addTask);
  const moveTask = useBoardStore((state) => state.moveTask);
  const loadFromStorage = useBoardStore((state) => state.loadFromStorage);

  const filteredTasks = useFilteredTasks();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(tasks[active.id as string] || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask("todo", newTaskTitle);
      setNewTaskTitle("");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Kanban Board</h2>
        <form onSubmit={handleAddTask} className="flex gap-2">
          <Input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="新しいタスクを追加..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <PlusCircle size={20} />
          </Button>
        </form>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            if (!column) return null;

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
