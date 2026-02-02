import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  requestNotificationPermission,
  notifyDueTomorrow,
  notifyDueToday,
  notifyOverdue,
  notifyRecurringTaskGenerated,
  // 後方互換性テスト用
  notifyOverdueTasks,
  notifyUpcomingTasks,
  showNotification,
} from "./notificationService";
import type { Task } from "@/types";

// Tauri Notification APIのモック
vi.mock("@tauri-apps/api/notification", () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

import * as tauriNotification from "@tauri-apps/api/notification";

describe("notificationService", () => {
  const createMockTask = (
    id: string,
    title: string,
    priority: "low" | "medium" | "high" | "urgent" = "medium",
    dueDate?: string
  ): Task => ({
    id,
    title,
    description: "",
    columnId: "todo",
    position: 0,
    priority,
    dueDate,
    assigneeIds: [],
    tagIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sync: {
      version: 1,
      lastModifiedAt: new Date().toISOString(),
      syncStatus: "local",
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestNotificationPermission", () => {
    it("既に許可されている場合はtrueを返す", async () => {
      vi.mocked(tauriNotification.isPermissionGranted).mockResolvedValue(true);

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(tauriNotification.isPermissionGranted).toHaveBeenCalled();
      expect(tauriNotification.requestPermission).not.toHaveBeenCalled();
    });

    it("許可されていない場合は要求して承認されたらtrueを返す", async () => {
      vi.mocked(tauriNotification.isPermissionGranted).mockResolvedValue(false);
      vi.mocked(tauriNotification.requestPermission).mockResolvedValue("granted");

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(tauriNotification.isPermissionGranted).toHaveBeenCalled();
      expect(tauriNotification.requestPermission).toHaveBeenCalled();
    });

    it("許可を要求して拒否された場合はfalseを返す", async () => {
      vi.mocked(tauriNotification.isPermissionGranted).mockResolvedValue(false);
      vi.mocked(tauriNotification.requestPermission).mockResolvedValue("denied");

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
      expect(tauriNotification.requestPermission).toHaveBeenCalled();
    });

    it("エラーが発生した場合はfalseを返す", async () => {
      vi.mocked(tauriNotification.isPermissionGranted).mockRejectedValue(
        new Error("Permission check failed")
      );

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });
  });

  describe("notifyDueTomorrow", () => {
    it("タスクが0件の場合は通知を送信しない", async () => {
      await notifyDueTomorrow([]);

      expect(tauriNotification.sendNotification).not.toHaveBeenCalled();
    });

    it("期限24時間前のタスクが1件の場合は通知を送信する", async () => {
      const tasks = [createMockTask("1", "週報作成", "high", "2026-02-03")];

      await notifyDueTomorrow(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "明日が期限のタスク (1件)",
        body: "- 週報作成 (優先度: 高)",
        icon: "icon.png",
      });
    });

    it("期限24時間前のタスクが複数件の場合は最大3件まで表示する", async () => {
      const tasks = [
        createMockTask("1", "タスク1", "urgent", "2026-02-03"),
        createMockTask("2", "タスク2", "high", "2026-02-03"),
        createMockTask("3", "タスク3", "medium", "2026-02-03"),
        createMockTask("4", "タスク4", "low", "2026-02-03"),
      ];

      await notifyDueTomorrow(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "明日が期限のタスク (4件)",
        body: expect.stringContaining("タスク1"),
        icon: "icon.png",
      });

      const call = vi.mocked(tauriNotification.sendNotification).mock.calls[0][0];
      const bodyLines = call.body?.split("\n") || [];
      expect(bodyLines.length).toBeLessThanOrEqual(3);
    });

    it("優先度ラベルが正しく表示される", async () => {
      const tasks = [
        createMockTask("1", "緊急タスク", "urgent", "2026-02-03"),
        createMockTask("2", "高優先度タスク", "high", "2026-02-03"),
      ];

      await notifyDueTomorrow(tasks);

      const call = vi.mocked(tauriNotification.sendNotification).mock.calls[0][0];
      expect(call.body).toContain("優先度: 緊急");
      expect(call.body).toContain("優先度: 高");
    });

    it("エラーが発生してもクラッシュしない", async () => {
      vi.mocked(tauriNotification.sendNotification).mockRejectedValue(
        new Error("Send failed")
      );

      const tasks = [createMockTask("1", "タスク1", "medium", "2026-02-03")];

      await expect(notifyDueTomorrow(tasks)).resolves.not.toThrow();
    });
  });

  describe("notifyDueToday", () => {
    it("タスクが0件の場合は通知を送信しない", async () => {
      await notifyDueToday([]);

      expect(tauriNotification.sendNotification).not.toHaveBeenCalled();
    });

    it("期限当日のタスクが1件の場合は通知を送信する", async () => {
      const tasks = [createMockTask("1", "プレゼン資料", "urgent", "2026-02-02")];

      await notifyDueToday(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "今日が期限のタスク (1件)",
        body: "- プレゼン資料 (優先度: 緊急)",
        icon: "icon.png",
      });
    });

    it("期限当日のタスクが複数件の場合は通知を送信する", async () => {
      const tasks = [
        createMockTask("1", "タスク1", "high", "2026-02-02"),
        createMockTask("2", "タスク2", "medium", "2026-02-02"),
      ];

      await notifyDueToday(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "今日が期限のタスク (2件)",
        body: expect.stringContaining("タスク1"),
        icon: "icon.png",
      });
    });
  });

  describe("notifyOverdue", () => {
    it("タスクが0件の場合は通知を送信しない", async () => {
      await notifyOverdue([]);

      expect(tauriNotification.sendNotification).not.toHaveBeenCalled();
    });

    it("期限超過のタスクがある場合は通知を送信する", async () => {
      const tasks = [
        createMockTask("1", "遅延タスク1", "high", "2026-01-30"),
        createMockTask("2", "遅延タスク2", "medium", "2026-01-31"),
      ];

      await notifyOverdue(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "期限切れのタスク (2件)",
        body: "タスクを確認してください",
        icon: "icon.png",
      });
    });
  });

  describe("notifyRecurringTaskGenerated", () => {
    it("繰り返しタスクが生成されたときに通知を送信する", async () => {
      const task = createMockTask("1", "週報作成", "medium", "2026-02-10");

      await notifyRecurringTaskGenerated(task);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "繰り返しタスクを生成しました",
        body: "週報作成 (期限: 2026-02-10)",
        icon: "icon.png",
      });
    });

    it("期限が未設定の場合も通知を送信する", async () => {
      const task = createMockTask("1", "日次レビュー", "medium");

      await notifyRecurringTaskGenerated(task);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "繰り返しタスクを生成しました",
        body: "日次レビュー (期限: 未設定)",
        icon: "icon.png",
      });
    });
  });

  // 後方互換性のテスト
  describe("backward compatibility", () => {
    it("notifyOverdueTasks()はnotifyOverdue()を呼び出す", async () => {
      const tasks = [createMockTask("1", "タスク1")];

      await notifyOverdueTasks(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "期限切れのタスク (1件)",
        body: "タスクを確認してください",
        icon: "icon.png",
      });
    });

    it("notifyUpcomingTasks()は従来の動作を維持する", async () => {
      const tasks = [createMockTask("1", "タスク1"), createMockTask("2", "タスク2")];

      await notifyUpcomingTasks(tasks);

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "期限が近いタスクが2件あります",
        body: "タスク1\nタスク2",
        icon: "icon.png",
      });
    });

    it("showNotification()は通知を送信する", async () => {
      await showNotification("テスト通知", { body: "テスト本文", icon: "test.png" });

      expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
        title: "テスト通知",
        body: "テスト本文",
        icon: "test.png",
      });
    });
  });
});
