import React, { useState, useMemo, useCallback } from "react";
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

// 優先度カラーマッピング（コンポーネント外にHoist）
const PRIORITY_COLORS: Record<Task["priority"], string> = {
  urgent: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  low: "text-green-600 bg-green-50 border-green-200",
};

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
};

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

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 md:gap-6 p-3 md:p-6 overflow-auto">
      {/* カレンダー部分 */}
      <div className="flex-shrink-0 lg:w-auto w-full lg:max-w-md">
        <div className="bg-background rounded-lg border border-border/50 shadow-apple p-3 md:p-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <CalendarIcon size={18} className="text-primary md:w-5 md:h-5" />
            <h2 className="text-base md:text-lg font-semibold tracking-tight">カレンダー</h2>
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
              --rdp-cell-size: 36px;
              --rdp-accent-color: hsl(var(--primary));
              --rdp-background-color: hsl(var(--primary) / 0.1);
            }

            @media (min-width: 640px) {
              .calendar-apple {
                --rdp-cell-size: 44px;
              }
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
      <div className="flex-1 overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
        <div className="bg-background rounded-lg border border-border/50 shadow-apple p-3 md:p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
            <h2 className="text-base md:text-lg font-semibold tracking-tight">
              {selectedDate ? format(selectedDate, "M月d日（E）", { locale: ja }) : "日付を選択"}
            </h2>
            <span className="text-xs md:text-sm text-muted-foreground">
              {selectedDateTasks.length}件
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
                      "p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all",
                      "hover:shadow-apple-md hover:scale-[1.01]",
                      isOverdue
                        ? "border-red-200 bg-red-50/50"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 md:gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex-shrink-0 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-xs font-medium border",
                          PRIORITY_COLORS[task.priority]
                        )}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-3 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          {isOverdue ? (
                            <AlertCircle size={12} className="text-red-600 md:w-3.5 md:h-3.5" />
                          ) : (
                            <Clock size={12} className="md:w-3.5 md:h-3.5" />
                          )}
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {format(parseISO(task.dueDate), "HH:mm")}
                          </span>
                        </div>
                      )}

                      {task.assigneeIds.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User size={12} className="md:w-3.5 md:h-3.5" />
                          <span className="truncate">
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
