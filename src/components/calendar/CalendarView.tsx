import React, { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { ja } from "date-fns/locale";
import { format, parseISO, startOfDay, isSameDay, isPast } from "date-fns";
import { useBoardStore } from "@/stores/useBoardStore";
import { useFilteredTasks } from "@/hooks/useFilteredTasks";
import { Task } from "@/types";
import { Calendar as CalendarIcon, Clock, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import EditTaskDialog from "../task/EditTaskDialog";
import "react-day-picker/dist/style.css";

const CalendarView: React.FC = () => {
  const filteredTasks = useFilteredTasks();
  const members = useBoardStore((state) => state.members);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 期限があるタスクを日付ごとにグループ化
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    filteredTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(parseISO(task.dueDate), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // 期限があるタスクの日付リスト
  const datesWithTasks = useMemo(() => {
    return Object.keys(tasksByDate).map((dateStr) => parseISO(dateStr));
  }, [tasksByDate]);

  // 選択された日付のタスク
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  // 過去の期限の日付リスト
  const overdueDates = useMemo(() => {
    const today = startOfDay(new Date());
    return datesWithTasks.filter((date) => isPast(date) && !isSameDay(date, today));
  }, [datesWithTasks]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "緊急";
      case "high":
        return "高";
      case "medium":
        return "中";
      case "low":
        return "低";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
      {/* カレンダー部分 */}
      <div className="flex-shrink-0 lg:w-auto">
        <div className="bg-background rounded-2xl border border-border/50 shadow-apple p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon size={20} className="text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">カレンダー</h2>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            onDayClick={handleDayClick}
            locale={ja}
            modifiers={{
              hasTasks: datesWithTasks,
              overdue: overdueDates,
            }}
            modifiersClassNames={{
              hasTasks: "has-tasks",
              overdue: "overdue-date",
            }}
            className="calendar-apple"
          />
          <style>{`
            .calendar-apple {
              --rdp-cell-size: 44px;
              --rdp-accent-color: hsl(var(--primary));
              --rdp-background-color: hsl(var(--primary) / 0.1);
            }

            .calendar-apple .rdp-day_selected {
              background-color: hsl(var(--primary));
              color: white;
              font-weight: 600;
            }

            .calendar-apple .rdp-day_today {
              font-weight: 700;
              color: hsl(var(--primary));
            }

            .calendar-apple .has-tasks {
              position: relative;
            }

            .calendar-apple .has-tasks::after {
              content: '';
              position: absolute;
              bottom: 4px;
              left: 50%;
              transform: translateX(-50%);
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: hsl(var(--primary));
            }

            .calendar-apple .overdue-date {
              color: hsl(0 84.2% 60.2%);
              font-weight: 600;
            }

            .calendar-apple .overdue-date::after {
              background-color: hsl(0 84.2% 60.2%);
            }

            .calendar-apple .rdp-day:hover:not(.rdp-day_selected) {
              background-color: hsl(var(--muted));
              border-radius: 8px;
            }

            .calendar-apple .rdp-day_selected:hover {
              background-color: hsl(var(--primary) / 0.9);
            }

            .calendar-apple .rdp-month {
              width: 100%;
            }

            .calendar-apple .rdp-caption {
              margin-bottom: 1rem;
            }

            .calendar-apple .rdp-head_cell {
              font-weight: 600;
              font-size: 0.875rem;
              color: hsl(var(--muted-foreground));
            }
          `}</style>
        </div>
      </div>

      {/* タスクリスト部分 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-background rounded-2xl border border-border/50 shadow-apple p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {selectedDate ? format(selectedDate, "M月d日（E）", { locale: ja }) : "日付を選択"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {selectedDateTasks.length}件のタスク
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
            {selectedDateTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarIcon size={48} className="mb-4 opacity-20" />
                <p className="text-sm">この日のタスクはありません</p>
              </div>
            ) : (
              selectedDateTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  isPast(parseISO(task.dueDate)) &&
                  !isSameDay(parseISO(task.dueDate), new Date());

                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      "hover:shadow-apple-md hover:scale-[1.01]",
                      isOverdue
                        ? "border-red-200 bg-red-50/50"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium border",
                          getPriorityColor(task.priority)
                        )}
                      >
                        {getPriorityLabel(task.priority)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          {isOverdue ? (
                            <AlertCircle size={14} className="text-red-600" />
                          ) : (
                            <Clock size={14} />
                          )}
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {format(parseISO(task.dueDate), "HH:mm")}
                          </span>
                        </div>
                      )}

                      {task.assigneeIds.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>
                            {task.assigneeIds
                              .map((id) => members[id]?.name || "不明")
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* タスク編集ダイアログ */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

export default CalendarView;
