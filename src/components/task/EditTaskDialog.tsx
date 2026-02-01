import React, { useState, useEffect, useMemo } from "react";
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
import { Task } from "@/types";
import { Trash2, Archive, Plus, CheckSquare } from "lucide-react";
import { useBoardStore, selectTags, selectColumns, selectColumnOrder } from "@/stores/useBoardStore";
import { Badge } from "@/components/ui/badge";
import { RecurrenceSettings } from "./RecurrenceSettings";
import { Separator } from "@/components/ui/separator";
import { PRIORITY_OPTIONS } from "@/constants/priority";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  open,
  onClose,
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

  const activeMembers = useMemo(
    () => Object.values(members).filter((m) => m.isActive),
    [members]
  );

  const allTags = useMemo(() => Object.values(tags), [tags]);

  useEffect(() => {
    if (open) {
      setFormData(task);
    }
  }, [task, open]);

  const handleSave = () => {
    updateTask(task.id, formData);
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
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    toggleSubtask(task.id, subtaskId);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask(task.id, subtaskId);
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/50 shadow-apple-xl glass p-0">
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
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
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
              <div className="flex gap-2">
                <Input
                  placeholder="新しいサブタスクを追加..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  aria-label="サブタスクを追加"
                >
                  <Plus size={20} />
                </Button>
              </div>
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-md border"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
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
            className="rounded-xl transition-apple"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl transition-apple hover:scale-105"
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
