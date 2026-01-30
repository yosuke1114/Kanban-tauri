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

  const handleDeleteMember = (memberId: string) => {
    if (confirm("このメンバーを削除しますか?")) {
      deleteMember(memberId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>メンバー管理</DialogTitle>
          <DialogDescription>
            チームメンバーを追加・編集します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                      onClick={() => handleDeleteMember(member.id)}
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

        <DialogFooter>
          <Button onClick={onClose}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberManager;
