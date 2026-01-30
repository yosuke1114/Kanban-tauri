import { useEffect, useRef } from "react";
import { useBoardStore } from "@/stores/useBoardStore";
import {
  requestNotificationPermission,
  notifyOverdueTasks,
  notifyUpcomingTasks,
} from "@/services/notification/notificationService";

/**
 * 期限チェック・通知フック
 * アプリ起動時と定期的に期限をチェックして通知を表示
 */
export function useDueDateNotifications() {
  const tasks = useBoardStore((state) => state.tasks);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    // 初回のみ通知（アプリ起動時）
    if (hasNotifiedRef.current) return;

    const checkAndNotify = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      const allTasks = Object.values(tasks);

      // 期限切れタスク（完了していない）
      const overdueTasks = allTasks.filter((task) => {
        if (!task.dueDate || task.columnId === "done") return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
      });

      // 期限が近いタスク（3日以内、完了していない）
      const upcomingTasks = allTasks.filter((task) => {
        if (!task.dueDate || task.columnId === "done") return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= threeDaysLater;
      });

      if (overdueTasks.length > 0) {
        notifyOverdueTasks(overdueTasks);
      }

      if (upcomingTasks.length > 0) {
        notifyUpcomingTasks(upcomingTasks);
      }

      hasNotifiedRef.current = true;
    };

    // 少し遅延させて通知（タスクの読み込みを待つ）
    const timer = setTimeout(checkAndNotify, 2000);

    return () => clearTimeout(timer);
  }, [tasks]);

  // 日次チェック（毎日9時に通知）
  useEffect(() => {
    const checkDaily = () => {
      const now = new Date();
      const nextCheck = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        9,
        0,
        0
      );

      const timeout = nextCheck.getTime() - now.getTime();

      const timer = setTimeout(() => {
        hasNotifiedRef.current = false; // リセットして再通知を許可
        checkDaily(); // 次の日のチェックをスケジュール
      }, timeout);

      return () => clearTimeout(timer);
    };

    const cleanup = checkDaily();
    return cleanup;
  }, []);
}
