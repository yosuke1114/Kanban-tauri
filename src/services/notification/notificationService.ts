import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";
import { Task, Priority } from "@/types";

/**
 * 優先度ラベルマッピング
 */
const PRIORITY_LABELS: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

/**
 * 通知権限を確認・要求
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    return permissionGranted;
  } catch (error) {
    console.error("通知権限の確認に失敗しました:", error);
    return false;
  }
}

/**
 * 期限24時間前の通知を表示
 */
export async function notifyDueTomorrow(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;

  const title = `明日が期限のタスク (${tasks.length}件)`;
  const body = tasks
    .slice(0, 3)
    .map((t) => `- ${t.title} (優先度: ${PRIORITY_LABELS[t.priority]})`)
    .join("\n");

  try {
    await sendNotification({
      title,
      body,
      icon: "icon.png",
    });
  } catch (error) {
    console.error("通知の送信に失敗しました:", error);
  }
}

/**
 * 期限当日の通知を表示
 */
export async function notifyDueToday(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;

  const title = `今日が期限のタスク (${tasks.length}件)`;
  const body = tasks
    .slice(0, 3)
    .map((t) => `- ${t.title} (優先度: ${PRIORITY_LABELS[t.priority]})`)
    .join("\n");

  try {
    await sendNotification({
      title,
      body,
      icon: "icon.png",
    });
  } catch (error) {
    console.error("通知の送信に失敗しました:", error);
  }
}

/**
 * 期限超過の通知を表示
 */
export async function notifyOverdue(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;

  const title = `期限切れのタスク (${tasks.length}件)`;
  const body = "タスクを確認してください";

  try {
    await sendNotification({
      title,
      body,
      icon: "icon.png",
    });
  } catch (error) {
    console.error("通知の送信に失敗しました:", error);
  }
}

/**
 * 繰り返しタスク生成の通知を表示
 */
export async function notifyRecurringTaskGenerated(task: Task): Promise<void> {
  const title = "繰り返しタスクを生成しました";
  const body = `${task.title} (期限: ${task.dueDate || "未設定"})`;

  try {
    await sendNotification({
      title,
      body,
      icon: "icon.png",
    });
  } catch (error) {
    console.error("通知の送信に失敗しました:", error);
  }
}

// ===== 後方互換性のための既存関数 =====

/**
 * タスクの期限切れ通知を表示
 * @deprecated notifyOverdue()を使用してください
 */
export async function notifyOverdueTasks(tasks: Task[]): Promise<void> {
  return notifyOverdue(tasks);
}

/**
 * タスクの期限が近い通知を表示
 * @deprecated notifyDueTomorrow()またはnotifyDueToday()を使用してください
 */
export async function notifyUpcomingTasks(tasks: Task[]): Promise<void> {
  // 既存の動作を維持（3日以内のタスク）
  if (tasks.length === 0) return;

  const title = `期限が近いタスクが${tasks.length}件あります`;
  const body = tasks
    .slice(0, 3)
    .map((t) => t.title)
    .join("\n");

  try {
    await sendNotification({
      title,
      body,
      icon: "icon.png",
    });
  } catch (error) {
    console.error("通知の送信に失敗しました:", error);
  }
}

/**
 * デスクトップ通知を表示
 * @deprecated 直接sendNotification()を使用してください
 */
export async function showNotification(
  title: string,
  options?: { body?: string; icon?: string }
): Promise<void> {
  try {
    await sendNotification({
      title,
      body: options?.body,
      icon: options?.icon || "icon.png",
    });
  } catch (error) {
    console.error("通知の送信に失敗しました:", error);
  }
}
