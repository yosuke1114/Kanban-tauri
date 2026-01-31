import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Copy, Trash2 } from "lucide-react";

interface TaskContextMenuProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  onEdit,
  onDuplicate,
  onDelete,
  children,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 rounded-xl border-border/50 shadow-apple-lg glass">
        <ContextMenuItem
          onClick={onEdit}
          className="rounded-lg cursor-pointer transition-apple"
        >
          <Edit size={16} className="mr-2" />
          編集
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onDuplicate}
          className="rounded-lg cursor-pointer transition-apple"
        >
          <Copy size={16} className="mr-2" />
          複製
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="rounded-lg text-destructive focus:text-destructive cursor-pointer transition-apple"
        >
          <Trash2 size={16} className="mr-2" />
          削除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
