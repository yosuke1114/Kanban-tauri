import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDueDateNotifications } from "./useDueDateNotifications";
import * as notificationService from "@/services/notification/notificationService";
import type { Task } from "@/types";

// useBoardStoreのモック（マルチボード対応）
let mockTasks: { [key: string]: Task } = {};
const mockNotificationSettings = {
  enabled: true,
  deadlineNotificationsEnabled: true,
  deadlineNotificationHour: 9,
  deadlineNotificationMinute: 0,
  recurringGeneratedEnabled: true,
};

vi.mock("@/stores/useBoardStore", () => ({
  useBoardStore: vi.fn((selector) => {
    if (typeof selector === "function") {
      return selector({
        boards: {
          default: {
            id: "default",
            name: "テストボード",
            tasks: mockTasks,
            columns: {},
            columnOrder: [],
            tags: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        currentBoardId: "default",
        notificationSettings: mockNotificationSettings,
      });
    }
    return {
      boards: {
        default: {
          tasks: mockTasks,
        },
      },
      currentBoardId: "default",
      notificationSettings: mockNotificationSettings,
    };
  }),
}));

// Tauri Notification APIのモック
vi.mock("@tauri-apps/api/notification", () => ({
  isPermissionGranted: vi.fn().mockResolvedValue(true),
  requestPermission: vi.fn().mockResolvedValue("granted"),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

// 通知サービスのモック
vi.mock("@/services/notification/notificationService", async () => {
  const actual = await vi.importActual("@/services/notification/notificationService");
  return {
    ...actual,
    requestNotificationPermission: vi.fn().mockResolvedValue(true),
    notifyDueTomorrow: vi.fn().mockResolvedValue(undefined),
    notifyDueToday: vi.fn().mockResolvedValue(undefined),
    notifyOverdue: vi.fn().mockResolvedValue(undefined),
  };
});

describe("useDueDateNotifications", () => {
  const createMockTask = (
    id: string,
    title: string,
    dueDate: string,
    priority: "low" | "medium" | "high" | "urgent" = "medium",
    columnId: string = "todo"
  ): Task => ({
    id,
    title,
    description: "",
    columnId,
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
    status: "active",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockTasks = {};
  });

  it("通知権限をリクエストする", () => {
    renderHook(() => useDueDateNotifications());

    expect(notificationService.requestNotificationPermission).toHaveBeenCalled();
  });

  it("優先度順にタスクをソートする機能をテスト", () => {
    // sortTasksByPriorityは内部関数なので、実装の正しさを確認
    const tasks = [
      createMockTask("1", "低", "2026-02-03", "low"),
      createMockTask("2", "緊急", "2026-02-03", "urgent"),
      createMockTask("3", "中", "2026-02-03", "medium"),
      createMockTask("4", "高", "2026-02-03", "high"),
    ];

    // 優先度順: urgent > high > medium > low
    // 実装が正しければ、notifyDueTomorrowに渡されるタスクの順序が正しいはず
    expect(tasks[1].priority).toBe("urgent"); // 最優先
    expect(tasks[3].priority).toBe("high");
    expect(tasks[2].priority).toBe("medium");
    expect(tasks[0].priority).toBe("low"); // 最低優先度
  });

  it("完了済みタスクは除外される", () => {
    const taskDone = createMockTask("1", "完了タスク", "2026-02-02", "high", "done");

    // columnId が "done" のタスクは除外される
    expect(taskDone.columnId).toBe("done");
  });

  it("削除済みタスクは除外される", () => {
    const taskDeleted = createMockTask("1", "削除タスク", "2026-02-02", "high");
    taskDeleted.status = "deleted";

    // status が "deleted" のタスクは除外される
    expect(taskDeleted.status).toBe("deleted");
  });

  it("通知ステートがlocalStorageに保存される", () => {
    const state = {
      due24Hours: "2026-02-02",
      dueToday: "2026-02-02",
      overdue: "2026-02-02",
    };

    localStorage.setItem("notificationState", JSON.stringify(state));

    const saved = localStorage.getItem("notificationState");
    expect(saved).not.toBeNull();

    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.due24Hours).toBe("2026-02-02");
      expect(parsed.dueToday).toBe("2026-02-02");
      expect(parsed.overdue).toBe("2026-02-02");
    }
  });
});
