import { RecurrenceRule } from "@/types";
import { addDays, addWeeks, addMonths } from "date-fns";

/**
 * 繰り返しルールに基づいて次の期限を計算
 */
export function calculateNextDueDate(
  currentDueDate: string,
  recurrence: RecurrenceRule
): string {
  const current = new Date(currentDueDate);

  switch (recurrence.type) {
    case "daily":
      return addDays(current, recurrence.interval).toISOString();
    case "weekly":
      return addWeeks(current, recurrence.interval).toISOString();
    case "monthly":
      return addMonths(current, recurrence.interval).toISOString();
    default:
      return currentDueDate;
  }
}

/**
 * 繰り返しが終了しているかチェック
 */
export function isRecurrenceEnded(
  nextDueDate: string,
  recurrence: RecurrenceRule
): boolean {
  if (!recurrence.endDate) return false;
  const next = new Date(nextDueDate);
  const end = new Date(recurrence.endDate);
  return next > end;
}

/**
 * 繰り返しルールの説明テキストを生成
 */
export function getRecurrenceDescription(recurrence: RecurrenceRule): string {
  const typeLabels = {
    daily: "日",
    weekly: "週",
    monthly: "ヶ月",
  };

  const intervalText =
    recurrence.interval === 1
      ? `毎${typeLabels[recurrence.type]}`
      : `${recurrence.interval}${typeLabels[recurrence.type]}ごと`;

  if (recurrence.endDate) {
    return `${intervalText} (${recurrence.endDate}まで)`;
  }

  return intervalText;
}
