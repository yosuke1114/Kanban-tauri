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
import { useBoardStore } from "@/stores/useBoardStore";
import { Trash2, UserPlus } from "lucide-react";

interface MemberManagerProps {
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

const MemberManager: React.FC<MemberManagerProps> = ({ open, onClose }) => {
  const members = useBoardStore((state) => state.members);
  const addMember = useBoardStore((state) => state.addMember);
  const updateMember = useBoardStore((state) => state.updateMember);
  const deleteMember = useBoardStore((state) => state.deleteMember);
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(newMemberName, selectedColor);
      setNewMemberName("");
      setSelectedColor(colorOptions[0]);
    }
  };

  const handleToggleActive = (memberId: string, isActive: boolean) => {
    updateMember(memberId, { isActive: !isActive });
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    setDeleteTarget({ id: memberId, name: memberName });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMember(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/50 shadow-apple-xl glass p-0">
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
            <div className="flex gap-2">
              <Input
                id="memberName"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="名前を入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
              />
              <Button onClick={handleAddMember} size="icon">
                <UserPlus size={20} />
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
            <Label>登録済みメンバー</Label>
            <div className="space-y-2 mt-2">
              {Object.values(members).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
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
                      onClick={() => handleToggleActive(member.id, member.isActive)}
                    >
                      {member.isActive ? "無効化" : "有効化"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              {Object.keys(members).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  メンバーが登録されていません
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/20">
          <Button onClick={onClose} className="rounded-xl transition-apple">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              メンバーを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              この操作は取り消せません。メンバー「{deleteTarget?.name}
              」が完全に削除され、関連するタスクから割り当てが解除されます。
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

export default MemberManager;
