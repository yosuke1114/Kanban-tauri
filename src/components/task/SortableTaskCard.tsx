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

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task }) => {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const softDeleteTask = useBoardStore((state) => state.softDeleteTask);
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
  };

  const handleDuplicate = useCallback(() => {
    // シンプルな複製: タイトルだけコピー
    addTask(task.columnId, `${task.title} (コピー)`);
  }, [task, addTask]);

  const handleDelete = useCallback(() => {
    softDeleteTask(task.id);
    setIsDeleteOpen(false);
  }, [task.id, softDeleteTask]);

  return (
    <>
      <TaskContextMenu
        onEdit={() => setIsEditOpen(true)}
        onDuplicate={handleDuplicate}
        onDelete={() => setIsDeleteOpen(true)}
      >
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
          <TaskCard
            task={task}
            isDragging={isDragging}
            onClick={() => {
              setIsEditOpen(true);
            }}
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
};

export default SortableTaskCard;
