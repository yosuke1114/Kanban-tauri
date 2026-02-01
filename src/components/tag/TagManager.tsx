import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useBoardStore, selectTags } from "@/stores/useBoardStore";
import { Trash2, Tag as TagIcon } from "lucide-react";
import { INPUT_LIMITS, validateInput } from "@/constants/validation";

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
  const tags = useBoardStore(selectTags);
  const addTag = useBoardStore((state) => state.addTag);
  const deleteTag = useBoardStore((state) => state.deleteTag);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [tagNameError, setTagNameError] = useState<string | null>(null);

  const handleAddTag = () => {
    const error = validateInput.general(newTagName, INPUT_LIMITS.TAG_NAME);
    if (error) {
      setTagNameError(error);
      return;
    }

    addTag(newTagName.trim(), selectedColor);
    setNewTagName("");
    setSelectedColor(colorOptions[0]);
    setTagNameError(null);
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    setDeleteTarget({ id: tagId, name: tagName });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteTag(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-lg border-border/50 shadow-apple-xl glass p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            タグ管理
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            タスクに設定するタグを追加・編集します
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">新しいタグ</Label>
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  id="tagName"
                  data-testid="tag-name-input"
                  value={newTagName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewTagName(value);
                    // リアルタイムバリデーション
                    if (value.length > INPUT_LIMITS.TAG_NAME) {
                      setTagNameError(validateInput.maxLength(value, INPUT_LIMITS.TAG_NAME));
                    } else {
                      setTagNameError(null);
                    }
                  }}
                  placeholder="タグ名を入力"
                  maxLength={INPUT_LIMITS.TAG_NAME}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  onClick={handleAddTag}
                  size="icon"
                  data-testid="add-tag-button"
                  disabled={!!tagNameError || !newTagName.trim()}
                >
                  <TagIcon size={20} />
                </Button>
              </div>
              {tagNameError && (
                <p className="text-xs text-destructive">{tagNameError}</p>
              )}
              {newTagName && (
                <p className="text-xs text-muted-foreground text-right">
                  {newTagName.length}/{INPUT_LIMITS.TAG_NAME}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  data-testid={`color-option-${color}`}
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
                  data-testid={`tag-item-${tag.id}`}
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
                    data-testid={`delete-tag-${tag.id}`}
                    className="h-5 w-5 text-destructive"
                    onClick={() => handleDeleteTag(tag.id, tag.name)}
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

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/20">
          <Button onClick={onClose} className="rounded-md transition-apple">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-lg border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              タグを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              この操作は取り消せません。タグ「{deleteTarget?.name}
              」が完全に削除され、関連するタスクから削除されます。
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

export default TagManager;
