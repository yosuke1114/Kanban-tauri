/**
 * 期限日の状態を判定
 * @param dueDate 期限日（YYYY-MM-DD形式）
 * @returns status: "overdue" | "today" | "soon" | "future" | null
 *          daysUntilDue: 期限までの日数（過去の場合は負の値）
 */
export const getDueDateStatus = (dueDate?: string) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "overdue" as const, daysUntilDue: diffDays };
  }
  if (diffDays === 0) {
    return { status: "today" as const, daysUntilDue: 0 };
  }
  if (diffDays <= 3) {
    return { status: "soon" as const, daysUntilDue: diffDays };
  }
  return { status: "future" as const, daysUntilDue: diffDays };
};

/**
 * 期限日の状態に応じたCSSクラスを取得（TaskCard用）
 */
export const getDueDateColorClass = (dueDate?: string): string => {
  const status = getDueDateStatus(dueDate);
  if (!status) return "";

  switch (status.status) {
    case "overdue":
      return "text-red-600 font-semibold";
    case "today":
      return "text-orange-600 font-semibold";
    case "soon":
      return "text-yellow-600";
    default:
      return "";
  }
};

/**
 * 期限日の状態に応じたCSSクラスを取得（ListView用）
 */
export const getDueDateColor = (dueDate?: string): string => {
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
