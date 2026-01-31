import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoardStore, selectColumns, selectColumnOrder, selectTasks } from "@/stores/useBoardStore";
import { Trash2, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column } from "@/types";

interface ColumnManagerProps {
  open: boolean;
  onClose: () => void;
}

const colorOptions = [
  { color: "#94a3b8", name: "グレー" },
  { color: "#60a5fa", name: "ブルー" },
  { color: "#34d399", name: "グリーン" },
  { color: "#fbbf24", name: "イエロー" },
  { color: "#fb923c", name: "オレンジ" },
  { color: "#f87171", name: "レッド" },
  { color: "#a78bfa", name: "パープル" },
  { color: "#ec4899", name: "ピンク" },
];

interface SortableColumnItemProps {
  column: Column;
  onDelete: (id: string, name: string) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg border bg-background"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={16} className="text-muted-foreground" />
      </button>
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: column.color }}
      />
      <span className="flex-1">{column.title}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(column.id, column.title)}
        className="text-destructive hover:bg-destructive/10 transition-apple rounded-lg"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
};

const ColumnManager: React.FC<ColumnManagerProps> = ({ open, onClose }) => {
  const columns = useBoardStore(selectColumns);
  const columnOrder = useBoardStore(selectColumnOrder);
  const tasks = useBoardStore(selectTasks);
  const addColumn = useBoardStore((state) => state.addColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  const reorderColumns = useBoardStore((state) => state.reorderColumns);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].color);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle, selectedColor);
      setNewColumnTitle("");
      setSelectedColor(colorOptions[0].color);
    }
  };

  const handleDeleteColumn = (columnId: string, columnName: string) => {
    // 列が1つしかない場合は削除不可
    if (columnOrder.length <= 1) {
      setDeleteError("最後の列は削除できません。少なくとも1つの列が必要です。");
      return;
    }

    // 列にタスクが存在する場合は削除不可
    const tasksInColumn = Object.values(tasks).filter(
      (task) => task.columnId === columnId
    );
    if (tasksInColumn.length > 0) {
      setDeleteError(
        `この列には${tasksInColumn.length}個のタスクがあります。タスクを移動または削除してから、列を削除してください。`
      );
      return;
    }

    setDeleteError("");
    setDeleteTarget({ id: columnId, name: columnName });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteColumn(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
        reorderColumns(newOrder);
      }
    },
    [columnOrder, reorderColumns]
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/50 shadow-apple-xl glass p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            列の管理
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            カンバンの列を追加・編集します
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="columnTitle">新しい列</Label>
            <div className="flex gap-2">
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="列名を入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddColumn();
                  }
                }}
              />
              <Button onClick={handleAddColumn} size="icon">
                <Plus size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {colorOptions.map((option) => (
                <button
                  key={option.color}
                  type="button"
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    border-2 transition-all
                    hover:scale-105
                    ${
                      selectedColor === option.color
                        ? "border-primary bg-primary/5 scale-105"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                  onClick={() => setSelectedColor(option.color)}
                  title={option.name}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-xs font-medium truncate">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Label>現在の列</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 mt-2">
                  {columnOrder.map((columnId) => {
                    const column = columns[columnId];
                    if (!column) return null;

                    return (
                      <SortableColumnItem
                        key={column.id}
                        column={column}
                        onDelete={handleDeleteColumn}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/20">
          <Button onClick={onClose} className="rounded-xl transition-apple">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 削除エラーダイアログ */}
      <AlertDialog
        open={deleteError !== ""}
        onOpenChange={(open) => !open && setDeleteError("")}
      >
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              列を削除できません
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {deleteError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDeleteError("")}
              className="rounded-xl transition-apple"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              列を削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              この操作は取り消せません。列「{deleteTarget?.name}」が完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl transition-apple">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-apple"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ColumnManager;
