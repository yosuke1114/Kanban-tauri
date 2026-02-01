import React, { useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import TaskCard from "./TaskCard";
import EditTaskDialog from "./EditTaskDialog";
import { TaskContextMenu } from "./TaskContextMenu";
import { useBoardStore } from "@/stores/useBoardStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SortableTaskCardProps {
  task: Task;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = React.memo(({ task }) => {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const softDeleteTask = useBoardStore((state) => state.softDeleteTask);
  const archiveTask = useBoardStore((state) => state.archiveTask);
  const addTask = useBoardStore((state) => state.addTask);

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
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? "1.05" : "1",
    zIndex: isDragging ? 1000 : "auto",
    boxShadow: isDragging
      ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      : undefined,
  } as React.CSSProperties;

  const handleDuplicate = useCallback(() => {
    // シンプルな複製: タイトルだけコピー
    addTask(task.columnId, `${task.title} (コピー)`);
  }, [task.columnId, task.title, addTask]);

  const handleArchive = useCallback(() => {
    archiveTask(task.id);
  }, [task.id, archiveTask]);

  const handleDelete = useCallback(() => {
    softDeleteTask(task.id);
    setIsDeleteOpen(false);
  }, [task.id, softDeleteTask]);

  const handleCardClick = useCallback(() => {
    setIsEditOpen(true);
  }, []);

  return (
    <>
      <TaskContextMenu
        onEdit={() => setIsEditOpen(true)}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={() => setIsDeleteOpen(true)}
      >
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
          <TaskCard
            task={task}
            isDragging={isDragging}
            onClick={handleCardClick}
          />
        </div>
      </TaskContextMenu>

      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              タスクをゴミ箱に移動しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              タスク「{task.title}」はゴミ箱に移動されます。ゴミ箱から復元することができます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl transition-apple">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-apple"
            >
              ゴミ箱に移動
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

SortableTaskCard.displayName = "SortableTaskCard";

export default SortableTaskCard;
