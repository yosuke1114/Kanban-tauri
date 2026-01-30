import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "@/stores/useBoardStore";
import { Trash2, Tag as TagIcon } from "lucide-react";

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
}

const colorOptions = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const TagManager: React.FC<TagManagerProps> = ({ open, onClose }) => {
  const tags = useBoardStore((state) => state.tags);
  const addTag = useBoardStore((state) => state.addTag);
  const deleteTag = useBoardStore((state) => state.deleteTag);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName, selectedColor);
      setNewTagName("");
      setSelectedColor(colorOptions[0]);
    }
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm("このタグを削除しますか?")) {
      deleteTag(tagId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>タグ管理</DialogTitle>
          <DialogDescription>
            タスクに設定するタグを追加・編集します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">新しいタグ</Label>
            <div className="flex gap-2">
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="タグ名を入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} size="icon">
                <TagIcon size={20} />
              </Button>
            </div>

            <div className="flex gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-primary scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Label>登録済みタグ</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.values(tags).map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-1 p-1 pr-2 rounded-full border"
                  style={{ borderColor: tag.color }}
                >
                  <Badge
                    variant="outline"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              {Object.keys(tags).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 w-full">
                  タグが登録されていません
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagManager;
