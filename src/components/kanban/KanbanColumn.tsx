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
      className="flex-shrink-0 w-full sm:w-80 md:w-96 bg-secondary/50 rounded-lg p-4 snap-start"
      style={{
        borderTop: `3px solid ${column.color}`,
      }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          {column.title}
          <span className="text-sm text-muted-foreground ml-auto">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2 min-h-[200px]">
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(KanbanColumn);
