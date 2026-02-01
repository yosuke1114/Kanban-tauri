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
import { Trash2, Plus, GripVertical, Pencil, Check, X } from "lucide-react";
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
import { INPUT_LIMITS, validateInput } from "@/constants/validation";

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
  onEdit: (id: string) => void;
  isEditing: boolean;
  editingTitle: string;
  editingColor: string;
  onTitleChange: (title: string) => void;
  onColorChange: (color: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  colorOptions: { color: string; name: string }[];
  editTitleError: string | null;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  onDelete,
  onEdit,
  isEditing,
  editingTitle,
  editingColor,
  onTitleChange,
  onColorChange,
  onSaveEdit,
  onCancelEdit,
  colorOptions,
  editTitleError,
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
        data-testid={`column-drag-handle-${column.id}`}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={16} className="text-muted-foreground" />
      </button>

      {isEditing ? (
        <>
          {/* カラー選択 */}
          <div className="flex gap-1">
            {colorOptions.map((option) => (
              <button
                key={option.color}
                type="button"
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  editingColor === option.color
                    ? "border-primary scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: option.color }}
                onClick={() => onColorChange(option.color)}
                title={option.name}
              />
            ))}
          </div>

          {/* 名前編集 */}
          <div className="flex-1">
            <Input
              value={editingTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="h-8"
              maxLength={INPUT_LIMITS.COLUMN_TITLE}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSaveEdit();
                } else if (e.key === "Escape") {
                  onCancelEdit();
                }
              }}
            />
            {editTitleError && (
              <p className="text-xs text-destructive mt-0.5">{editTitleError}</p>
            )}
          </div>

          {/* 保存/キャンセルボタン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSaveEdit}
            className="h-8 w-8 text-primary hover:bg-primary/10"
            disabled={!!editTitleError || !editingTitle.trim()}
          >
            <Check size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelEdit}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </>
      ) : (
        <>
          <div
            className="w-3 h-3 rounded-full"
            data-testid={`column-color-${column.id}`}
            style={{ backgroundColor: column.color }}
          />
          <span className="flex-1">{column.title}</span>

          {/* 編集ボタン */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(column.id)}
            className="h-8 w-8 hover:bg-muted transition-apple rounded-lg"
          >
            <Pencil size={14} />
          </Button>

          {/* 削除ボタン */}
          <Button
            variant="ghost"
            size="icon"
            data-testid={`delete-column-${column.id}`}
            onClick={() => onDelete(column.id, column.title)}
            className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-apple rounded-lg"
          >
            <Trash2 size={16} />
          </Button>
        </>
      )}
    </div>
  );
};

const ColumnManager: React.FC<ColumnManagerProps> = ({ open, onClose }) => {
  const columns = useBoardStore(selectColumns);
  const columnOrder = useBoardStore(selectColumnOrder);
  const tasks = useBoardStore(selectTasks);
  const addColumn = useBoardStore((state) => state.addColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const reorderColumns = useBoardStore((state) => state.reorderColumns);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].color);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingColor, setEditingColor] = useState("");
  const [columnTitleError, setColumnTitleError] = useState<string | null>(null);
  const [editTitleError, setEditTitleError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddColumn = () => {
    const error = validateInput.general(newColumnTitle, INPUT_LIMITS.COLUMN_TITLE);
    if (error) {
      setColumnTitleError(error);
      return;
    }

    addColumn(newColumnTitle.trim(), selectedColor);
    setNewColumnTitle("");
    setSelectedColor(colorOptions[0].color);
    setColumnTitleError(null);
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

  const handleEditColumn = (columnId: string) => {
    const column = columns[columnId];
    if (column) {
      setEditingColumnId(columnId);
      setEditingTitle(column.title);
      setEditingColor(column.color);
    }
  };

  const handleSaveEdit = () => {
    if (!editingColumnId) return;

    const error = validateInput.general(editingTitle, INPUT_LIMITS.COLUMN_TITLE);
    if (error) {
      setEditTitleError(error);
      return;
    }

    updateColumn(editingColumnId, {
      title: editingTitle.trim(),
      color: editingColor,
    });
    setEditingColumnId(null);
    setEditingTitle("");
    setEditingColor("");
    setEditTitleError(null);
  };

  const handleCancelEdit = () => {
    setEditingColumnId(null);
    setEditingTitle("");
    setEditingColor("");
    setEditTitleError(null);
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
      <DialogContent className="sm:max-w-md rounded-lg border-border/50 shadow-apple-xl glass p-0">
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
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  id="columnTitle"
                  data-testid="column-name-input"
                  value={newColumnTitle}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewColumnTitle(value);
                    // リアルタイムバリデーション
                    if (value.length > INPUT_LIMITS.COLUMN_TITLE) {
                      setColumnTitleError(validateInput.maxLength(value, INPUT_LIMITS.COLUMN_TITLE));
                    } else {
                      setColumnTitleError(null);
                    }
                  }}
                  placeholder="列名を入力"
                  maxLength={INPUT_LIMITS.COLUMN_TITLE}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddColumn();
                    }
                  }}
                />
                <Button
                  onClick={handleAddColumn}
                  size="icon"
                  data-testid="add-column-button"
                  disabled={!!columnTitleError || !newColumnTitle.trim()}
                >
                  <Plus size={20} />
                </Button>
              </div>
              {columnTitleError && (
                <p className="text-xs text-destructive">{columnTitleError}</p>
              )}
              {newColumnTitle && (
                <p className="text-xs text-muted-foreground text-right">
                  {newColumnTitle.length}/{INPUT_LIMITS.COLUMN_TITLE}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {colorOptions.map((option) => (
                <button
                  key={option.color}
                  type="button"
                  data-testid={`color-option-${option.name}`}
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
                        onEdit={handleEditColumn}
                        isEditing={editingColumnId === column.id}
                        editingTitle={editingTitle}
                        editingColor={editingColor}
                        onTitleChange={(value) => {
                          setEditingTitle(value);
                          // リアルタイムバリデーション
                          if (value.length > INPUT_LIMITS.COLUMN_TITLE) {
                            setEditTitleError(validateInput.maxLength(value, INPUT_LIMITS.COLUMN_TITLE));
                          } else {
                            setEditTitleError(null);
                          }
                        }}
                        onColorChange={setEditingColor}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        colorOptions={colorOptions}
                        editTitleError={editTitleError}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/20">
          <Button onClick={onClose} className="rounded-md transition-apple">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 削除エラーダイアログ */}
      <AlertDialog
        open={deleteError !== ""}
        onOpenChange={(open) => !open && setDeleteError("")}
      >
        <AlertDialogContent className="rounded-lg border-border/50 shadow-apple-xl glass">
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
              className="rounded-md transition-apple"
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
        <AlertDialogContent className="rounded-lg border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              列を削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              この操作は取り消せません。列「{deleteTarget?.name}」が完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md transition-apple">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-apple"
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
