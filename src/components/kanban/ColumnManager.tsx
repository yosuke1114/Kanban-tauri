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
import { Trash2, Plus, GripVertical } from "lucide-react";

interface ColumnManagerProps {
  open: boolean;
  onClose: () => void;
}

const colorOptions = [
  "#94a3b8", // グレー
  "#60a5fa", // ブルー
  "#34d399", // グリーン
  "#fbbf24", // イエロー
  "#fb923c", // オレンジ
  "#f87171", // レッド
  "#a78bfa", // パープル
  "#ec4899", // ピンク
];

const ColumnManager: React.FC<ColumnManagerProps> = ({ open, onClose }) => {
  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
  const addColumn = useBoardStore((state) => state.addColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle, selectedColor);
      setNewColumnTitle("");
      setSelectedColor(colorOptions[0]);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns[columnId];
    if (column?.isDefault) {
      alert("デフォルトの列は削除できません");
      return;
    }
    if (confirm("この列を削除しますか? 列内のタスクも削除されます。")) {
      deleteColumn(columnId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>列の管理</DialogTitle>
          <DialogDescription>カンバンの列を追加・編集します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="columnTitle">新しい列</Label>
            <div className="flex gap-2">
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="列名を入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddColumn();
                  }
                }}
              />
              <Button onClick={handleAddColumn} size="icon">
                <Plus size={20} />
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
            <Label>現在の列</Label>
            <div className="space-y-2 mt-2">
              {columnOrder.map((columnId) => {
                const column = columns[columnId];
                if (!column) return null;

                return (
                  <div
                    key={column.id}
                    className="flex items-center gap-2 p-2 rounded-lg border"
                  >
                    <GripVertical size={16} className="text-muted-foreground" />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="flex-1">{column.title}</span>
                    {column.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        デフォルト
                      </Badge>
                    )}
                    {!column.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteColumn(column.id)}
                        className="text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                );
              })}
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

export default ColumnManager;
