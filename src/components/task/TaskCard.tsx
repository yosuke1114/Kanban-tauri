import React from "react";
import { Task } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "@/stores/useBoardStore";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar,
  User,
  Circle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

// デフォルト値を定数として定義（メモ化破壊を防ぐ）
const NOOP = () => {};

const PRIORITY_CONFIG = {
  low: {
    label: "低",
    variant: "secondary" as const,
    color: "#34d399",
    icon: Circle,
  },
  medium: {
    label: "中",
    variant: "default" as const,
    color: "#fbbf24",
    icon: AlertCircle,
  },
  high: {
    label: "高",
    variant: "destructive" as const,
    color: "#fb923c",
    icon: AlertTriangle,
  },
  urgent: {
    label: "緊急",
    variant: "destructive" as const,
    color: "#ef4444",
    icon: AlertOctagon,
  },
};

const getDueDateStatus = (dueDate?: string) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return { status: "overdue", label: "期限切れ", color: "#ef4444" };
  } else if (diffDays === 0) {
    return { status: "today", label: "今日", color: "#fb923c" };
  } else if (diffDays <= 3) {
    return { status: "soon", label: "期限間近", color: "#fbbf24" };
  }
  return null;
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging,
  onClick = NOOP,
}) => {
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore((state) => state.tags);

  const dueDateStatus = getDueDateStatus(task.dueDate);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isDragging && "opacity-50 rotate-2"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium leading-tight">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <CardDescription className="text-xs line-clamp-2">
            {task.description}
          </CardDescription>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge
            variant={PRIORITY_CONFIG[task.priority].variant}
            className="text-xs flex items-center gap-1"
          >
            {React.createElement(PRIORITY_CONFIG[task.priority].icon, {
              size: 12,
            })}
            {PRIORITY_CONFIG[task.priority].label}
          </Badge>

          {task.tagIds.map((tagId) => {
            const tag = tags[tagId];
            if (!tag) return null;
            return (
              <Badge
                key={tagId}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs">
            <Calendar size={12} />
            <span
              className={cn(
                dueDateStatus && "font-semibold"
              )}
              style={{
                color: dueDateStatus?.color,
              }}
            >
              {format(new Date(task.dueDate), "M/d (E)", { locale: ja })}
              {dueDateStatus && ` - ${dueDateStatus.label}`}
            </span>
          </div>
        )}

        {task.assigneeIds.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <User size={12} className="text-muted-foreground" />
            {task.assigneeIds.map((assigneeId) => {
              const member = members[assigneeId];
              if (!member) return null;
              return (
                <Badge
                  key={assigneeId}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: member.color,
                    color: member.color,
                  }}
                >
                  {member.name}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(TaskCard);
