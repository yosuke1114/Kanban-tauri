import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import TaskCard from "./TaskCard";
import EditTaskDialog from "./EditTaskDialog";

interface SortableTaskCardProps {
  task: Task;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task }) => {
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <TaskCard
          task={task}
          isDragging={isDragging}
          onClick={() => {
            setIsEditOpen(true);
          }}
        />
      </div>

      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  );
};

export default SortableTaskCard;
