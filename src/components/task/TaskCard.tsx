import React, { useMemo } from "react";
import { Task } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useBoardStore, selectTags } from "@/stores/useBoardStore";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, User, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/constants/priority";
import { getDueDateStatus } from "@/utils/dueDate";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

// デフォルト値を定数として定義（メモ化破壊を防ぐ）
const NOOP = () => {};

// 期限日ステータスのラベルと色のマッピング
const DUE_DATE_STATUS_CONFIG = {
  overdue: { label: "期限切れ", color: "#ef4444" },
  today: { label: "今日", color: "#fb923c" },
  soon: { label: "期限間近", color: "#fbbf24" },
  future: { label: "", color: "" },
} as const;

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging,
  onClick = NOOP,
}) => {
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore(selectTags);

  const dueDateStatusResult = getDueDateStatus(task.dueDate);
  const dueDateStatus = dueDateStatusResult
    ? DUE_DATE_STATUS_CONFIG[dueDateStatusResult.status]
    : null;

  // サブタスクの進捗計算
  const subtaskProgress = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter((st) => st.completed).length;
    const total = task.subtasks.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  }, [task.subtasks]);

  return (
    <Card
      className={cn(
        "group cursor-pointer rounded-xl border border-border/50",
        "bg-card shadow-apple hover:shadow-apple-md",
        "transition-all duration-200 hover:-translate-y-0.5",
        "backdrop-blur-sm bg-opacity-95",
        isDragging && "opacity-50 rotate-2 shadow-apple-xl ring-2 ring-primary/30"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <CardDescription className="text-xs line-clamp-2">
            {task.description}
          </CardDescription>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={PRIORITY_CONFIG[task.priority].variant}
            className="text-xs font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full shadow-sm"
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
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
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

        {subtaskProgress && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckSquare size={12} />
              <span className="font-medium">
                {subtaskProgress.completed}/{subtaskProgress.total} 完了
              </span>
            </div>
            <Progress
              value={subtaskProgress.percentage}
              className="h-1.5"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(TaskCard);
