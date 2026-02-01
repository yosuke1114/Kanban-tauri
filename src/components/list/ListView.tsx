import React, { useState, useMemo } from "react";
import { useBoardStore, selectColumns, selectTags } from "@/stores/useBoardStore";
import { useFilteredTasks } from "@/hooks/useFilteredTasks";
import { Task, SortField, SortDirection } from "@/types";
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
import {
  PRIORITY_ORDER,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/constants/priority";
import { getDueDateColor } from "@/utils/dueDate";

// SortIconコンポーネントを外部に移動（パフォーマンス最適化）
interface SortIconProps {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}

const SortIcon: React.FC<SortIconProps> = React.memo(({ field, sortField, sortDirection }) => {
  if (sortField !== field) {
    return <ArrowUpDown size={14} className="ml-1 opacity-40" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp size={14} className="ml-1" />
  ) : (
    <ArrowDown size={14} className="ml-1" />
  );
});

SortIcon.displayName = "SortIcon";

const ListView: React.FC = () => {
  const columns = useBoardStore(selectColumns);
  const members = useBoardStore((state) => state.members);
  const tags = useBoardStore(selectTags);

  const filteredTasks = useFilteredTasks();

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "title":
          return direction * a.title.localeCompare(b.title, "ja");
        case "priority":
          return direction * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
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
  }, [filteredTasks, sortField, sortDirection]);

  return (
    <div className="w-full h-full overflow-auto p-4">
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
                  <SortIcon field="title" sortField={sortField} sortDirection={sortDirection} />
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
                  <SortIcon field="priority" sortField={sortField} sortDirection={sortDirection} />
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
                  <SortIcon field="dueDate" sortField={sortField} sortDirection={sortDirection} />
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
                  <SortIcon field="createdAt" sortField={sortField} sortDirection={sortDirection} />
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
                          PRIORITY_COLORS[task.priority]
                        }`}
                      >
                        {PRIORITY_LABELS[task.priority]}
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
