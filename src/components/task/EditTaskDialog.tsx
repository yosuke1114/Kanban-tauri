import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, Priority } from "@/types";
import { Trash2, Archive, Plus, CheckSquare } from "lucide-react";
import { useBoardStore, selectTags, selectColumns, selectColumnOrder } from "@/stores/useBoardStore";
import { Badge } from "@/components/ui/badge";
import { RecurrenceSettings } from "./RecurrenceSettings";
import { Separator } from "@/components/ui/separator";
import { PRIORITY_OPTIONS } from "@/constants/priority";
import { INPUT_LIMITS, validateInput } from "@/constants/validation";
import { toast } from "@/hooks/use-toast";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  isNewTask?: boolean;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  open,
  onClose,
  isNewTask = false,
}) => {
  const updateTask = useBoardStore((state) => state.updateTask);
  const softDeleteTask = useBoardStore((state) => state.softDeleteTask);
  const archiveTask = useBoardStore((state) => state.archiveTask);
  const addSubtask = useBoardStore((state) => state.addSubtask);
  const toggleSubtask = useBoardStore((state) => state.toggleSubtask);
  const deleteSubtask = useBoardStore((state) => state.deleteSubtask);
  const updateSubtask = useBoardStore((state) => state.updateSubtask);
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore(selectTags);
  const columns = useBoardStore(selectColumns);
  const columnOrder = useBoardStore(selectColumnOrder);
  const [formData, setFormData] = useState<Partial<Task>>(task);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const autoSaveTimer = useRef<number | null>(null);

  const activeMembers = useMemo(
    () => Object.values(members).filter((m) => m.isActive),
    [members]
  );

  const allTags = useMemo(() => Object.values(tags), [tags]);

  useEffect(() => {
    if (open) {
      setFormData(task);
      isInitialMount.current = true;
    }
  }, [task, open]);

  // 自動保存機能
  useEffect(() => {
    // 初回マウント時はスキップ
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // ダイアログが閉じている場合はスキップ
    if (!open) return;

    // バリデーションエラーがある場合はスキップ
    const titleErr = validateInput.general(formData.title || "", INPUT_LIMITS.TASK_TITLE);
    const descErr = formData.description
      ? validateInput.maxLength(formData.description, INPUT_LIMITS.TASK_DESCRIPTION)
      : null;
    if (titleErr || descErr) return;

    // 前回のタイマーをクリア
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // デバウンス: 500ms後に保存
    autoSaveTimer.current = setTimeout(() => {
      updateTask(task.id, formData);
    }, 500);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formData, open, task.id, updateTask]);

  const handleSave = () => {
    // バリデーション
    const titleErr = validateInput.general(formData.title || "", INPUT_LIMITS.TASK_TITLE);
    const descErr = formData.description
      ? validateInput.maxLength(formData.description, INPUT_LIMITS.TASK_DESCRIPTION)
      : null;

    if (titleErr) {
      setTitleError(titleErr);
      return;
    }
    if (descErr) {
      setDescriptionError(descErr);
      return;
    }

    updateTask(task.id, formData);

    // 新規タスクの場合はトーストを表示
    if (isNewTask) {
      toast({
        title: "タスクを作成しました",
        description: formData.title || task.title,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    softDeleteTask(task.id);
    setShowDeleteAlert(false);
    onClose();
  };

  const handleArchive = () => {
    archiveTask(task.id);
    onClose();
  };

  const toggleAssignee = (memberId: string) => {
    const assigneeIds = formData.assigneeIds || [];
    setFormData({
      ...formData,
      assigneeIds: assigneeIds.includes(memberId)
        ? assigneeIds.filter((id) => id !== memberId)
        : [...assigneeIds, memberId],
    });
  };

  const toggleTag = (tagId: string) => {
    const tagIds = formData.tagIds || [];
    setFormData({
      ...formData,
      tagIds: tagIds.includes(tagId)
        ? tagIds.filter((id) => id !== tagId)
        : [...tagIds, tagId],
    });
  };

  const handleAddSubtask = () => {
    // バリデーション
    const error = validateInput.general(newSubtaskTitle, INPUT_LIMITS.SUBTASK_TITLE);
    if (error) {
      setSubtaskError(error);
      return;
    }

    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    setSubtaskError(null);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    toggleSubtask(task.id, subtaskId);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask(task.id, subtaskId);
  };

  const handleSubtaskDueDateChange = (subtaskId: string, dateString: string) => {
    updateSubtask(task.id, subtaskId, {
      dueDate: dateString || undefined,
    });
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-border/50 shadow-apple-xl glass p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                タスクを編集
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                タスクの詳細を編集します
              </DialogDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleArchive}
                className="text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-apple"
                aria-label="アーカイブ"
              >
                <Archive size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-testid="delete-task-button"
                onClick={() => setShowDeleteAlert(true)}
                className="text-destructive rounded-lg hover:bg-destructive/10 transition-apple"
                aria-label="ゴミ箱に移動"
              >
                <Trash2 size={20} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, title: value });
                // リアルタイムバリデーション
                if (value.length > INPUT_LIMITS.TASK_TITLE) {
                  setTitleError(validateInput.maxLength(value, INPUT_LIMITS.TASK_TITLE));
                } else {
                  setTitleError(null);
                }
              }}
              maxLength={INPUT_LIMITS.TASK_TITLE}
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {(formData.title || "").length}/{INPUT_LIMITS.TASK_TITLE}
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, description: value });
                // リアルタイムバリデーション
                if (value.length > INPUT_LIMITS.TASK_DESCRIPTION) {
                  setDescriptionError(validateInput.maxLength(value, INPUT_LIMITS.TASK_DESCRIPTION));
                } else {
                  setDescriptionError(null);
                }
              }}
              rows={4}
              maxLength={INPUT_LIMITS.TASK_DESCRIPTION}
            />
            {descriptionError && (
              <p className="text-xs text-destructive">{descriptionError}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {(formData.description || "").length}/{INPUT_LIMITS.TASK_DESCRIPTION}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">優先度</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="優先度を選択" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="columnId">ステータス</Label>
              <Select
                value={formData.columnId}
                onValueChange={(value) =>
                  setFormData({ ...formData, columnId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOrder.map((columnId) => {
                    const column = columns[columnId];
                    if (!column) return null;
                    return (
                      <SelectItem key={column.id} value={column.id}>
                        {column.title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">期限</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label>担当者</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeMembers.map((member) => {
                const isSelected = (formData.assigneeIds || []).includes(
                  member.id
                );
                return (
                  <Badge
                    key={member.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    style={
                      isSelected
                        ? { backgroundColor: member.color }
                        : { borderColor: member.color, color: member.color }
                    }
                    onClick={() => toggleAssignee(member.id)}
                  >
                    {member.name}
                  </Badge>
                );
              })}
              {activeMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  メンバーが登録されていません
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>タグ</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map((tag) => {
                const isSelected = (formData.tagIds || []).includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    style={
                      isSelected
                        ? { backgroundColor: tag.color }
                        : { borderColor: tag.color, color: tag.color }
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
              {allTags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  タグが登録されていません
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* サブタスク */}
          <div>
            <Label className="flex items-center gap-2">
              <CheckSquare size={16} />
              サブタスク
            </Label>
            <div className="mt-2 space-y-2">
              <div className="space-y-1">
                <div className="flex gap-2">
                  <Input
                    data-testid="new-subtask-input"
                    placeholder="新しいサブタスクを追加..."
                    value={newSubtaskTitle}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewSubtaskTitle(value);
                      // リアルタイムバリデーション
                      if (value.length > INPUT_LIMITS.SUBTASK_TITLE) {
                        setSubtaskError(validateInput.maxLength(value, INPUT_LIMITS.SUBTASK_TITLE));
                      } else {
                        setSubtaskError(null);
                      }
                    }}
                    onKeyDown={handleSubtaskKeyDown}
                    className="flex-1"
                    maxLength={INPUT_LIMITS.SUBTASK_TITLE}
                  />
                  <Button
                    type="button"
                    size="icon"
                    data-testid="add-subtask-button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim() || !!subtaskError}
                    aria-label="サブタスクを追加"
                  >
                    <Plus size={20} />
                  </Button>
                </div>
                {subtaskError && (
                  <p className="text-xs text-destructive">{subtaskError}</p>
                )}
                {newSubtaskTitle && (
                  <p className="text-xs text-muted-foreground text-right">
                    {newSubtaskTitle.length}/{INPUT_LIMITS.SUBTASK_TITLE}
                  </p>
                )}
              </div>
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      data-testid={`subtask-item-${subtask.id}`}
                      className="flex items-center gap-2 p-2 rounded-md border"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        data-testid={`subtask-checkbox-${subtask.id}`}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          subtask.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <Input
                        type="date"
                        value={subtask.dueDate || ""}
                        onChange={(e) => handleSubtaskDueDateChange(subtask.id, e.target.value)}
                        className="w-auto h-8 text-xs"
                        aria-label="サブタスクの期限"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-testid={`delete-subtask-${subtask.id}`}
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="h-8 w-8"
                        aria-label="サブタスクを削除"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <RecurrenceSettings
            recurrence={formData.recurrence}
            onChange={(recurrence) =>
              setFormData({ ...formData, recurrence })
            }
          />
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/20">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-md transition-apple"
          >
            キャンセル
          </Button>
          <Button
            data-testid="save-task-button"
            onClick={handleSave}
            className="rounded-md transition-apple hover:scale-105"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>

      <DeleteConfirmationDialog
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirm={handleDelete}
        title="タスクをゴミ箱に移動しますか？"
        description={`タスク「${task.title}」はゴミ箱に移動されます。ゴミ箱から復元することができます。`}
      />
    </Dialog>
  );
};

export default EditTaskDialog;
