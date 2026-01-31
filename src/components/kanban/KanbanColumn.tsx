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
      className="flex-shrink-0 flex flex-col w-full min-w-[280px] md:w-[calc(50%-0.5rem)] md:min-w-[320px] md:snap-start lg:w-96 lg:snap-none xl:flex-1 xl:max-w-md h-full bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/50 shadow-apple p-6 transition-all duration-200 hover:shadow-apple-md"
    >
      <div className="mb-5 flex items-center gap-3 flex-shrink-0">
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

      <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-2 -mr-2">
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(KanbanColumn);
