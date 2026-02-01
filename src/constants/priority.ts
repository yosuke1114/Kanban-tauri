import { Priority } from "@/types";
import { Circle, AlertCircle, AlertTriangle, AlertOctagon } from "lucide-react";

/**
 * 優先度の設定（アイコン、ラベル、色、バリアント）
 */
export const PRIORITY_CONFIG = {
  low: {
    label: "低",
    variant: "secondary" as const,
    color: "#34d399",
    icon: Circle,
  },
  medium: {
    label: "中",
    variant: "default" as const,
    color: "#fbbf24",
    icon: AlertCircle,
  },
  high: {
    label: "高",
    variant: "destructive" as const,
    color: "#fb923c",
    icon: AlertTriangle,
  },
  urgent: {
    label: "緊急",
    variant: "destructive" as const,
    color: "#ef4444",
    icon: AlertOctagon,
  },
} as const;

/**
 * 優先度の表示順序（低→緊急）
 */
export const PRIORITY_ORDER: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

/**
 * 優先度のラベル
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

/**
 * 優先度のTailwind CSSクラス（ListView用）
 */
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

/**
 * 優先度のカレンダー表示用CSSクラス
 */
export const PRIORITY_CALENDAR_COLORS: Record<Priority, string> = {
  low: "text-green-600 bg-green-50 border-green-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  urgent: "text-red-600 bg-red-50 border-red-200",
};

/**
 * 優先度の選択肢（ドロップダウン用）
 */
export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "urgent", label: "緊急" },
];

/**
 * 優先度のラベルを取得
 */
export const getPriorityLabel = (priority: Priority): string => {
  return PRIORITY_LABELS[priority];
};

/**
 * 優先度のカレンダー表示用カラークラスを取得
 */
export const getPriorityCalendarColor = (priority: Priority): string => {
  return PRIORITY_CALENDAR_COLORS[priority];
};
