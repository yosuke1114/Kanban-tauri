import React from "react";
import { useBoardStore } from "@/stores/useBoardStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

interface BoardSelectorProps {
  onOpenBoardManager: () => void;
}

export const BoardSelector: React.FC<BoardSelectorProps> = ({
  onOpenBoardManager,
}) => {
  const boards = useBoardStore((state) => state.boards);
  const boardOrder = useBoardStore((state) => state.boardOrder);
  const currentBoardId = useBoardStore((state) => state.currentBoardId);
  const switchBoard = useBoardStore((state) => state.switchBoard);
  const addBoard = useBoardStore((state) => state.addBoard);

  const handleQuickAddBoard = () => {
    const boardCount = Object.keys(boards).length;
    addBoard(`新しいボード ${boardCount + 1}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentBoardId} onValueChange={switchBoard}>
        <SelectTrigger className="w-[200px] rounded-lg font-medium">
          <SelectValue placeholder="ボードを選択" />
        </SelectTrigger>
        <SelectContent>
          {boardOrder.map((boardId) => {
            const board = boards[boardId];
            if (!board) return null;
            return (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleQuickAddBoard}
        className="rounded-lg hover:bg-muted transition-apple"
        title="新しいボードを追加"
      >
        <Plus size={16} />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onOpenBoardManager}
        className="rounded-lg hover:bg-muted transition-apple"
        title="ボードを管理"
      >
        <Settings size={16} />
      </Button>
    </div>
  );
};
