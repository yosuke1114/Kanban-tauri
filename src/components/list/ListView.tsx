import React, { useState } from "react";
import { useBoardStore } from "@/stores/useBoardStore";
import { Task, SortField, SortDirection, Priority } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditTaskDialog from "../task/EditTaskDialog";

const ListView: React.FC = () => {
  const tasks = useBoardStore((state) => state.tasks);
  const columns = useBoardStore((state) => state.columns);
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore((state) => state.tags);
  const filters = useBoardStore((state) => state.filters);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // フィルター適用
  const allTasks = Object.values(tasks);
  const filteredTasks = allTasks.filter((task) => {
    // タグフィルター
    if (filters.tagIds.length > 0) {
      const hasMatchingTag = task.tagIds.some((tagId) =>
        filters.tagIds.includes(tagId)
      );
      if (!hasMatchingTag) return false;
    }

    // 担当者フィルター
    if (filters.assigneeIds.length > 0) {
      const hasMatchingAssignee = task.assigneeIds.some((assigneeId) =>
        filters.assigneeIds.includes(assigneeId)
      );
      if (!hasMatchingAssignee) return false;
    }

    // 優先度フィルター
    if (filters.priorities.length > 0) {
      if (!filters.priorities.includes(task.priority)) return false;
    }

    return true;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "title":
        return direction * a.title.localeCompare(b.title, "ja");
      case "priority": {
        const priorityOrder: Record<Priority, number> = {
          low: 1,
          medium: 2,
          high: 3,
          urgent: 4,
        };
        return direction * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      }
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return direction;
        if (!b.dueDate) return -direction;
        return (
          direction *
          (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        );
      case "createdAt":
        return (
          direction *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      default:
        return 0;
    }
  });

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="ml-1 opacity-40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="ml-1" />
    ) : (
      <ArrowDown size={14} className="ml-1" />
    );
  };

  const priorityLabels: Record<Priority, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "緊急",
  };

  const priorityColors: Record<Priority, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const getDueDateColor = (dueDate?: string): string => {
    if (!dueDate) return "";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "text-red-600 font-semibold";
    if (diffDays === 0) return "text-orange-600 font-semibold";
    if (diffDays <= 3) return "text-yellow-600";
    return "";
  };

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("title")}
                  className="h-8 px-2"
                >
                  タスク
                  <SortIcon field="title" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("priority")}
                  className="h-8 px-2"
                >
                  優先度
                  <SortIcon field="priority" />
                </Button>
              </TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("dueDate")}
                  className="h-8 px-2"
                >
                  期限
                  <SortIcon field="dueDate" />
                </Button>
              </TableHead>
              <TableHead>担当者</TableHead>
              <TableHead>タグ</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("createdAt")}
                  className="h-8 px-2"
                >
                  作成日
                  <SortIcon field="createdAt" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  タスクがありません
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => {
                const column = columns[task.columnId];
                const taskMembers = task.assigneeIds
                  .map((id) => members[id])
                  .filter(Boolean);
                const taskTags = task.tagIds.map((id) => tags[id]).filter(Boolean);

                return (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          {task.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {column && (
                        <span
                          className="inline-flex px-2 py-1 rounded-md text-xs font-medium text-white"
                          style={{ backgroundColor: column.color }}
                        >
                          {column.title}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span className={getDueDateColor(task.dueDate)}>
                          {format(new Date(task.dueDate), "M/d (E)", {
                            locale: ja,
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {taskMembers.length > 0 ? (
                          taskMembers.map((member) => (
                            <span
                              key={member.id}
                              className="inline-flex px-2 py-1 rounded-md text-xs font-medium text-white"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {taskTags.length > 0 ? (
                          taskTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex px-2 py-1 rounded-md text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(task.createdAt), "M/d", { locale: ja })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default ListView;
