import { useEffect, useRef } from "react";
import { useBoardStore } from "@/stores/useBoardStore";
import {
  requestNotificationPermission,
  notifyDueTomorrow,
  notifyDueToday,
  notifyOverdue,
} from "@/services/notification/notificationService";
import { PRIORITY_ORDER } from "@/constants/priority";
import { Task } from "@/types";

/**
 * 最後に通知した日付を管理するステート
 */
interface NotificationState {
  due24Hours: string | null; // ISO日付（日付のみ）
  dueToday: string | null;
  overdue: string | null;
}

const NOTIFICATION_STATE_KEY = "notificationState";

/**
 * 優先度順にタスクをソート（urgent > high > medium > low）
 */
const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 優先度が同じ場合は期限日でソート（早い順）
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });
};

/**
 * 期限チェック・通知フック
 * 1分ごとに期限をチェックして適切なタイミングで通知を表示
 */
export function useDueDateNotifications() {
  const tasks = useBoardStore((state) => state.boards[state.currentBoardId].tasks);
  const notificationSettings = useBoardStore((state) => state.notificationSettings);
  const lastNotifiedRef = useRef<NotificationState>({
    due24Hours: null,
    dueToday: null,
    overdue: null,
  });

  // localStorageから最後の通知日時を読み込み
  useEffect(() => {
    const savedState = localStorage.getItem(NOTIFICATION_STATE_KEY);
    if (savedState) {
      try {
        lastNotifiedRef.current = JSON.parse(savedState);
      } catch (error) {
        console.error("通知ステートの読み込みに失敗しました:", error);
      }
    }
  }, []);

  // 通知権限をリクエスト（初回のみ、設定が有効な場合のみ）
  useEffect(() => {
    if (notificationSettings.enabled) {
      requestNotificationPermission();
    }
  }, [notificationSettings.enabled]);

  // 定期チェック（1分ごと）
  useEffect(() => {
    // 通知が無効な場合は何もしない
    if (!notificationSettings.enabled) return;

    const checkNotifications = async () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const today = now.toISOString().split("T")[0];

      // activeなタスクのみ対象（削除済み・アーカイブ済みを除外）
      const allTasks = Object.values(tasks).filter(
        (task) =>
          (!task.status || task.status === "active") &&
          task.columnId !== "done" &&
          task.dueDate
      );

      if (allTasks.length === 0) {
        return;
      }

      // 通知対象のタスクを収集
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // 期限24時間前のタスク
      const tasksDueTomorrow = sortTasksByPriority(
        allTasks.filter((task) => task.dueDate === tomorrowStr)
      );

      // 期限当日のタスク
      const tasksDueToday = sortTasksByPriority(
        allTasks.filter((task) => task.dueDate === today)
      );

      // 期限超過のタスク
      const tasksOverdue = sortTasksByPriority(
        allTasks.filter((task) => task.dueDate! < today)
      );

      // 通知を送信（複数ある場合は2秒間隔）
      const notifications: Array<() => Promise<void>> = [];

      // 期限関連の通知が有効で、設定時刻にマッチした場合のみ通知
      if (notificationSettings.deadlineNotificationsEnabled) {
        // 分が一致すれば通知（1分刻みで設定可能）
        const isTimeMatch = currentMinute === notificationSettings.deadlineNotificationMinute;

        if (isTimeMatch) {
          // 期限24時間前の通知
          if (
            tasksDueTomorrow.length > 0 &&
            lastNotifiedRef.current.due24Hours !== today
          ) {
            notifications.push(async () => {
              await notifyDueTomorrow(tasksDueTomorrow);
              lastNotifiedRef.current.due24Hours = today;
            });
          }

          // 期限当日の通知
          if (
            tasksDueToday.length > 0 &&
            lastNotifiedRef.current.dueToday !== today
          ) {
            notifications.push(async () => {
              await notifyDueToday(tasksDueToday);
              lastNotifiedRef.current.dueToday = today;
            });
          }

          // 期限超過の通知
          if (
            tasksOverdue.length > 0 &&
            lastNotifiedRef.current.overdue !== today
          ) {
            notifications.push(async () => {
              await notifyOverdue(tasksOverdue);
              lastNotifiedRef.current.overdue = today;
            });
          }
        }
      }

      // 通知を順次送信（2秒間隔）
      if (notifications.length > 0) {
        for (let i = 0; i < notifications.length; i++) {
          await notifications[i]();

          // 最後の通知でなければ2秒待つ
          if (i < notifications.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        // localStorageに保存
        try {
          localStorage.setItem(
            NOTIFICATION_STATE_KEY,
            JSON.stringify(lastNotifiedRef.current)
          );
        } catch (error) {
          console.error("通知ステートの保存に失敗しました:", error);
        }
      }
    };

    // 初回チェック
    checkNotifications();

    // 1分ごとにチェック
    const interval = setInterval(checkNotifications, 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, notificationSettings]);
}
