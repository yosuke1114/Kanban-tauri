/**
 * メンバー/タグ用カラーオプション（シンプル配列）
 */
export const COLOR_OPTIONS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
] as const;

/**
 * カラム用カラーオプション（名前付き）
 */
export const COLUMN_COLOR_OPTIONS = [
  { color: "#94a3b8", name: "グレー" },
  { color: "#60a5fa", name: "ブルー" },
  { color: "#34d399", name: "グリーン" },
  { color: "#fbbf24", name: "イエロー" },
  { color: "#fb923c", name: "オレンジ" },
  { color: "#f87171", name: "レッド" },
  { color: "#a78bfa", name: "パープル" },
  { color: "#ec4899", name: "ピンク" },
] as const;
