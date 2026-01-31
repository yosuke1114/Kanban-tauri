import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Column, Task } from "@/types";
import SortableTaskCard from "../task/SortableTaskCard";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-full sm:w-80 md:w-96 bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/50 shadow-apple p-6 snap-start transition-all duration-200 hover:shadow-apple-md"
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className="w-1 h-6 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="font-semibold text-lg tracking-tight text-foreground">
          {column.title}
        </h3>
        <span className="ml-auto text-sm font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 min-h-[200px]">
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(KanbanColumn);
