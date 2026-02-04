import React, { useState, useCallback, useMemo } from "react";
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
import { useBoardStore } from "@/stores/useBoardStore";
import { Trash2, UserPlus, Pencil, Check, X } from "lucide-react";
import { INPUT_LIMITS, validateInput } from "@/constants/validation";
import { COLOR_OPTIONS } from "@/constants/colors";

interface MemberManagerProps {
  open: boolean;
  onClose: () => void;
}

const MemberManager: React.FC<MemberManagerProps> = React.memo(({ open, onClose }) => {
  const members = useBoardStore((state) => state.members);
  const addMember = useBoardStore((state) => state.addMember);
  const updateMember = useBoardStore((state) => state.updateMember);
  const deleteMember = useBoardStore((state) => state.deleteMember);
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_OPTIONS[0]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");
  const [memberNameError, setMemberNameError] = useState<string | null>(null);
  const [editNameError, setEditNameError] = useState<string | null>(null);

  // Object.values(members) をメモ化してパフォーマンス向上
  const membersList = useMemo(() => Object.values(members), [members]);

  const handleAddMember = useCallback(() => {
    const error = validateInput.general(newMemberName, INPUT_LIMITS.MEMBER_NAME);
    if (error) {
      setMemberNameError(error);
      return;
    }

    addMember(newMemberName.trim(), selectedColor);
    setNewMemberName("");
    setSelectedColor(COLOR_OPTIONS[0]);
    setMemberNameError(null);
  }, [newMemberName, selectedColor, addMember]);

  const handleToggleActive = useCallback((memberId: string, isActive: boolean) => {
    updateMember(memberId, { isActive: !isActive });
  }, [updateMember]);

  const handleDeleteMember = useCallback((memberId: string, memberName: string) => {
    setDeleteTarget({ id: memberId, name: memberName });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMember(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteMember]);

  const handleEditMember = useCallback((memberId: string) => {
    const member = members[memberId];
    if (member) {
      setEditingMemberId(memberId);
      setEditingName(member.name);
      setEditingColor(member.color);
    }
  }, [members]);

  const handleSaveEdit = useCallback(() => {
    if (!editingMemberId) return;

    const error = validateInput.general(editingName, INPUT_LIMITS.MEMBER_NAME);
    if (error) {
      setEditNameError(error);
      return;
    }

    updateMember(editingMemberId, {
      name: editingName.trim(),
      color: editingColor,
    });
    setEditingMemberId(null);
    setEditingName("");
    setEditingColor("");
    setEditNameError(null);
  }, [editingMemberId, editingName, editingColor, updateMember]);

  const handleCancelEdit = useCallback(() => {
    setEditingMemberId(null);
    setEditingName("");
    setEditingColor("");
    setEditNameError(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-lg border-border/50 shadow-apple-xl glass p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            メンバー管理
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            チームメンバーを追加・編集します
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberName">新しいメンバー</Label>
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  id="memberName"
                  data-testid="member-name-input"
                  value={newMemberName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewMemberName(value);
                    // リアルタイムバリデーション
                    if (value.length > INPUT_LIMITS.MEMBER_NAME) {
                      setMemberNameError(validateInput.maxLength(value, INPUT_LIMITS.MEMBER_NAME));
                    } else {
                      setMemberNameError(null);
                    }
                  }}
                  placeholder="名前を入力"
                  maxLength={INPUT_LIMITS.MEMBER_NAME}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                />
                <Button
                  onClick={handleAddMember}
                  size="icon"
                  data-testid="add-member-button"
                  disabled={!!memberNameError || !newMemberName.trim()}
                >
                  <UserPlus size={20} />
                </Button>
              </div>
              {memberNameError && (
                <p className="text-xs text-destructive">{memberNameError}</p>
              )}
              {newMemberName && (
                <p className="text-xs text-muted-foreground text-right">
                  {newMemberName.length}/{INPUT_LIMITS.MEMBER_NAME}
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
            <Label>登録済みメンバー</Label>
            <div className="space-y-2 mt-2">
              {membersList.map((member) => {
                const isEditing = editingMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    data-testid={`member-item-${member.id}`}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    {isEditing ? (
                      <>
                        {/* カラー選択 */}
                        <ColorPicker
                          colors={COLOR_OPTIONS}
                          selectedColor={editingColor}
                          onColorChange={setEditingColor}
                          testIdPrefix="color"
                        />

                        {/* 名前編集 */}
                        <div className="flex-1 mx-2">
                          <Input
                            value={editingName}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditingName(value);
                              // リアルタイムバリデーション
                              if (value.length > INPUT_LIMITS.MEMBER_NAME) {
                                setEditNameError(validateInput.maxLength(value, INPUT_LIMITS.MEMBER_NAME));
                              } else {
                                setEditNameError(null);
                              }
                            }}
                            className="h-8"
                            maxLength={INPUT_LIMITS.MEMBER_NAME}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                          />
                          {editNameError && (
                            <p className="text-xs text-destructive mt-0.5">{editNameError}</p>
                          )}
                        </div>

                        {/* 保存/キャンセルボタン */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveEdit}
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            disabled={!!editNameError || !editingName.trim()}
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            className="h-8 w-8"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            data-testid={`member-color-${member.id}`}
                            style={{ backgroundColor: member.color }}
                          />
                          <span className={!member.isActive ? "line-through opacity-50" : ""}>
                            {member.name}
                          </span>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? "有効" : "無効"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`toggle-member-${member.id}`}
                            onClick={() => handleToggleActive(member.id, member.isActive)}
                          >
                            {member.isActive ? "無効化" : "有効化"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMember(member.id)}
                            className="h-8 w-8 hover:bg-muted"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`delete-member-${member.id}`}
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {membersList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  メンバーが登録されていません
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
        title="メンバーを削除しますか？"
        description={`この操作は取り消せません。メンバー「${deleteTarget?.name}」が完全に削除され、関連するタスクから割り当てが解除されます。`}
      />
    </Dialog>
  );
});

MemberManager.displayName = "MemberManager";

export default MemberManager;
