import { Task } from "@/types";

/**
 * 通知権限を確認・要求
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("このブラウザは通知をサポートしていません");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * デスクトップ通知を表示
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
}

/**
 * タスクの期限切れ通知を表示
 */
export function notifyOverdueTasks(tasks: Task[]) {
  if (tasks.length === 0) return;

  const title = `期限切れのタスクが${tasks.length}件あります`;
  const body = tasks
    .slice(0, 3)
    .map((t) => t.title)
    .join("\n");

  showNotification(title, {
    body,
    icon: "/icon.png",
    tag: "overdue-tasks",
    requireInteraction: false,
  });
}

/**
 * タスクの期限が近い通知を表示
 */
export function notifyUpcomingTasks(tasks: Task[]) {
  if (tasks.length === 0) return;

  const title = `期限が近いタスクが${tasks.length}件あります`;
  const body = tasks
    .slice(0, 3)
    .map((t) => t.title)
    .join("\n");

  showNotification(title, {
    body,
    icon: "/icon.png",
    tag: "upcoming-tasks",
    requireInteraction: false,
  });
}
