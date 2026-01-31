import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useBoardStore } from "@/stores/useBoardStore";
import { Board } from "@/types";
import { Plus, Pencil, Trash2, Copy, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface BoardManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BoardManagerDialog: React.FC<BoardManagerDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const boards = useBoardStore((state) => state.boards);
  const boardOrder = useBoardStore((state) => state.boardOrder);
  const currentBoardId = useBoardStore((state) => state.currentBoardId);
  const addBoard = useBoardStore((state) => state.addBoard);
  const updateBoard = useBoardStore((state) => state.updateBoard);
  const deleteBoard = useBoardStore((state) => state.deleteBoard);
  const duplicateBoard = useBoardStore((state) => state.duplicateBoard);
  const switchBoard = useBoardStore((state) => state.switchBoard);

  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmBoard, setDeleteConfirmBoard] = useState<Board | null>(null);

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      addBoard(newBoardName.trim(), newBoardDescription.trim());
      setNewBoardName("");
      setNewBoardDescription("");
      setIsCreating(false);
    }
  };

  const handleUpdateBoard = () => {
    if (editingBoard && editingBoard.name.trim()) {
      updateBoard(editingBoard.id, {
        name: editingBoard.name.trim(),
        description: editingBoard.description?.trim(),
      });
      setEditingBoard(null);
    }
  };

  const handleDeleteBoard = (board: Board) => {
    setDeleteConfirmBoard(board);
  };

  const confirmDeleteBoard = () => {
    if (deleteConfirmBoard) {
      deleteBoard(deleteConfirmBoard.id);
      setDeleteConfirmBoard(null);
    }
  };

  const handleDuplicateBoard = (boardId: string) => {
    duplicateBoard(boardId);
  };

  const handleSelectBoard = (boardId: string) => {
    switchBoard(boardId);
    onOpenChange(false);
  };

  const getTaskCount = (board: Board) => {
    return Object.values(board.tasks).filter(
      (t) => t.status === "active" || !t.status
    ).length;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid size={20} />
              ボード管理
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 新規作成ボタン */}
            {!isCreating ? (
              <Button
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="w-full justify-start gap-2"
              >
                <Plus size={16} />
                新しいボードを作成
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="new-board-name">ボード名</Label>
                  <Input
                    id="new-board-name"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="ボード名を入力"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-board-description">説明（任意）</Label>
                  <Textarea
                    id="new-board-description"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="ボードの説明を入力"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
                    作成
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewBoardName("");
                      setNewBoardDescription("");
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {/* ボード一覧 */}
            <div className="space-y-2">
              {boardOrder.map((boardId) => {
                const board = boards[boardId];
                if (!board) return null;

                const isEditing = editingBoard?.id === boardId;
                const isCurrent = currentBoardId === boardId;
                const taskCount = getTaskCount(board);

                return (
                  <div
                    key={board.id}
                    className={`border rounded-lg p-4 ${
                      isCurrent ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${board.id}`}>ボード名</Label>
                          <Input
                            id={`edit-name-${board.id}`}
                            value={editingBoard.name}
                            onChange={(e) =>
                              setEditingBoard({ ...editingBoard, name: e.target.value })
                            }
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-desc-${board.id}`}>説明</Label>
                          <Textarea
                            id={`edit-desc-${board.id}`}
                            value={editingBoard.description || ""}
                            onChange={(e) =>
                              setEditingBoard({
                                ...editingBoard,
                                description: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateBoard} size="sm">
                            保存
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBoard(null)}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSelectBoard(board.id)}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{board.name}</h3>
                            {isCurrent && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                現在
                              </span>
                            )}
                          </div>
                          {board.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {board.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{taskCount}件のタスク</span>
                            <span>
                              更新: {format(new Date(board.updatedAt), "M/d HH:mm", { locale: ja })}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBoard(board)}
                            title="編集"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateBoard(board.id)}
                            title="複製"
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBoard(board)}
                            disabled={board.id === "default" || boardOrder.length <= 1}
                            title="削除"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={!!deleteConfirmBoard}
        onOpenChange={(open) => !open && setDeleteConfirmBoard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ボードを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteConfirmBoard?.name}」を削除すると、ボード内のすべてのタスクも削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBoard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
