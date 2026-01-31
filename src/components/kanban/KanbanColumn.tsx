import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Column, Task } from "@/types";
import { ViewportSize } from "@/hooks/useMediaQuery";
import SortableTaskCard from "../task/SortableTaskCard";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  viewportSize?: ViewportSize;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  viewportSize = "desktop",
}) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  // ビューポートサイズに応じたスタイルクラス
  const getColumnWidthClass = () => {
    switch (viewportSize) {
      case "mobile":
        return "w-full";
      case "tablet":
        return "w-[calc(50%-0.5rem)] min-w-[320px] snap-start";
      case "desktop":
      default:
        return "w-96 min-w-[320px] xl:flex-1 xl:max-w-md";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 flex flex-col h-full bg-muted/30 backdrop-blur-sm rounded-2xl border border-border/50 shadow-apple p-6 transition-all duration-200 hover:shadow-apple-md ${getColumnWidthClass()}`}
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
