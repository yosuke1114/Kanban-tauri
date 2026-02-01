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
import { Settings } from "lucide-react";

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

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <Select value={currentBoardId} onValueChange={switchBoard}>
        <SelectTrigger className="w-[120px] md:w-[200px] rounded-lg font-medium text-sm md:text-base">
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
        onClick={onOpenBoardManager}
        className="rounded-lg hover:bg-muted transition-apple h-8 w-8 md:h-9 md:w-9"
        title="ボードを管理"
      >
        <Settings size={14} className="md:w-4 md:h-4" />
      </Button>
    </div>
  );
};
