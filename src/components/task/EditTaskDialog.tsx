import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Task, Priority } from "@/types";
import { Trash2 } from "lucide-react";
import { useBoardStore } from "@/stores/useBoardStore";
import { Badge } from "@/components/ui/badge";
import { RecurrenceSettings } from "./RecurrenceSettings";
import { Separator } from "@/components/ui/separator";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "urgent", label: "緊急" },
];

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  task,
  open,
  onClose,
}) => {
  const updateTask = useBoardStore((state) => state.updateTask);
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore((state) => state.tags);
  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
  const [formData, setFormData] = useState<Partial<Task>>(task);

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
    if (confirm("このタスクを削除しますか?")) {
      deleteTask(task.id);
      onClose();
    }
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>タスクを編集</DialogTitle>
              <DialogDescription>タスクの詳細を編集します</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
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

          <RecurrenceSettings
            recurrence={formData.recurrence}
            onChange={(recurrence) =>
              setFormData({ ...formData, recurrence })
            }
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
