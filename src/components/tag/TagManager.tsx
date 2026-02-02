import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBoardStore, selectTags } from "@/stores/useBoardStore";
import { Trash2, Tag as TagIcon } from "lucide-react";
import { INPUT_LIMITS, validateInput } from "@/constants/validation";
import { COLOR_OPTIONS } from "@/constants/colors";

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ open, onClose }) => {
  const tags = useBoardStore(selectTags);
  const addTag = useBoardStore((state) => state.addTag);
  const deleteTag = useBoardStore((state) => state.deleteTag);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_OPTIONS[0]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [tagNameError, setTagNameError] = useState<string | null>(null);

  const handleAddTag = useCallback(() => {
    const error = validateInput.general(newTagName, INPUT_LIMITS.TAG_NAME);
    if (error) {
      setTagNameError(error);
      return;
    }

    addTag(newTagName.trim(), selectedColor);
    setNewTagName("");
    setSelectedColor(COLOR_OPTIONS[0]);
    setTagNameError(null);
  }, [newTagName, selectedColor, addTag]);

  const handleDeleteTag = useCallback((tagId: string, tagName: string) => {
    setDeleteTarget({ id: tagId, name: tagName });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteTag(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTag]);

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

            <ColorPicker
              colors={COLOR_OPTIONS}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              testIdPrefix="color"
            />
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

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="タグを削除しますか？"
        description={`この操作は取り消せません。タグ「${deleteTarget?.name}」が完全に削除され、関連するタスクから削除されます。`}
      />
    </Dialog>
  );
};

export default TagManager;
