import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDueDateStatus,
  getDueDateColorClass,
  getDueDateColor,
} from "./dueDate";

describe("dueDate", () => {
  beforeEach(() => {
    // 2024-01-15 00:00:00 に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDueDateStatus", () => {
    it("期限日が未設定の場合nullを返す", () => {
      expect(getDueDateStatus()).toBeNull();
      expect(getDueDateStatus("")).toBeNull();
    });

    it("期限日が過去の場合overdueを返す", () => {
      const result = getDueDateStatus("2024-01-10");
      expect(result).toEqual({ status: "overdue", daysUntilDue: -5 });
    });

    it("期限日が今日の場合todayを返す", () => {
      const result = getDueDateStatus("2024-01-15");
      expect(result).toEqual({ status: "today", daysUntilDue: 0 });
    });

    it("期限日が3日以内の場合soonを返す", () => {
      const result1 = getDueDateStatus("2024-01-16");
      expect(result1).toEqual({ status: "soon", daysUntilDue: 1 });

      const result2 = getDueDateStatus("2024-01-18");
      expect(result2).toEqual({ status: "soon", daysUntilDue: 3 });
    });

    it("期限日が4日以上先の場合futureを返す", () => {
      const result = getDueDateStatus("2024-01-20");
      expect(result).toEqual({ status: "future", daysUntilDue: 5 });
    });
  });

  describe("getDueDateColorClass", () => {
    it("期限日が未設定の場合空文字を返す", () => {
      expect(getDueDateColorClass()).toBe("");
    });

    it("期限日が過去の場合赤色クラスを返す", () => {
      expect(getDueDateColorClass("2024-01-10")).toBe(
        "text-red-600 font-semibold"
      );
    });

    it("期限日が今日の場合オレンジ色クラスを返す", () => {
      expect(getDueDateColorClass("2024-01-15")).toBe(
        "text-orange-600 font-semibold"
      );
    });

    it("期限日が3日以内の場合黄色クラスを返す", () => {
      expect(getDueDateColorClass("2024-01-18")).toBe("text-yellow-600");
    });

    it("期限日が4日以上先の場合空文字を返す", () => {
      expect(getDueDateColorClass("2024-01-20")).toBe("");
    });
  });

  describe("getDueDateColor", () => {
    it("期限日が未設定の場合空文字を返す", () => {
      expect(getDueDateColor()).toBe("");
      expect(getDueDateColor("")).toBe("");
    });

    it("期限日が過去の場合赤色クラスを返す", () => {
      expect(getDueDateColor("2024-01-10")).toBe("text-red-600 font-semibold");
    });

    it("期限日が今日の場合オレンジ色クラスを返す", () => {
      expect(getDueDateColor("2024-01-15")).toBe(
        "text-orange-600 font-semibold"
      );
    });

    it("期限日が3日以内の場合黄色クラスを返す", () => {
      expect(getDueDateColor("2024-01-18")).toBe("text-yellow-600");
    });

    it("期限日が4日以上先の場合空文字を返す", () => {
      expect(getDueDateColor("2024-01-20")).toBe("");
    });
  });
});
