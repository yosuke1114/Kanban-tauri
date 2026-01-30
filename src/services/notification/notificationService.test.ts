import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  requestNotificationPermission,
  showNotification,
  notifyOverdueTasks,
  notifyUpcomingTasks,
} from './notificationService';
import type { Task } from '@/types';

// Notification APIのモック
class NotificationMock {
  title: string;
  options?: NotificationOptions;
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn();

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }
}

describe('notificationService', () => {
  beforeEach(() => {
    // グローバルなNotificationをモックで置き換え
    (globalThis as any).Notification = NotificationMock as any;
    NotificationMock.permission = 'default';
    NotificationMock.requestPermission.mockClear();
  });

  describe('requestNotificationPermission', () => {
    it('Notification APIがサポートされていない場合はfalseを返す', async () => {
      // @ts-ignore - テスト用に一時的に削除
      delete (globalThis as any).Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });

    it('既に許可されている場合はtrueを返す', async () => {
      NotificationMock.permission = 'granted';

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(NotificationMock.requestPermission).not.toHaveBeenCalled();
    });

    it('許可を要求して承認された場合はtrueを返す', async () => {
      NotificationMock.permission = 'default';
      NotificationMock.requestPermission.mockResolvedValue('granted');

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(NotificationMock.requestPermission).toHaveBeenCalled();
    });

    it('許可を要求して拒否された場合はfalseを返す', async () => {
      NotificationMock.permission = 'default';
      NotificationMock.requestPermission.mockResolvedValue('denied');

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
      expect(NotificationMock.requestPermission).toHaveBeenCalled();
    });

    it('既に拒否されている場合はfalseを返す', async () => {
      NotificationMock.permission = 'denied';

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
      expect(NotificationMock.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('showNotification', () => {
    it('許可されている場合は通知を表示する', () => {
      NotificationMock.permission = 'granted';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      showNotification('テスト通知', { body: 'テスト本文' });

      expect(spy).toHaveBeenCalledWith('テスト通知', { body: 'テスト本文' });
    });

    it('許可されていない場合は通知を表示しない', () => {
      NotificationMock.permission = 'denied';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      showNotification('テスト通知');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('notifyOverdueTasks', () => {
    const createMockTask = (id: string, title: string): Task => ({
      id,
      title,
      description: '',
      columnId: 'todo',
      position: 0,
      priority: 'medium',
      assigneeIds: [],
      tagIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sync: {
        version: 1,
        lastModifiedAt: new Date().toISOString(),
        syncStatus: 'local',
      },
    });

    it('タスクが0件の場合は通知を表示しない', () => {
      NotificationMock.permission = 'granted';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      notifyOverdueTasks([]);

      expect(spy).not.toHaveBeenCalled();
    });

    it('期限切れタスクが1件の場合は通知を表示する', () => {
      NotificationMock.permission = 'granted';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      const tasks = [createMockTask('1', 'タスク1')];
      notifyOverdueTasks(tasks);

      expect(spy).toHaveBeenCalledWith(
        '期限切れのタスクが1件あります',
        expect.objectContaining({
          body: 'タスク1',
          tag: 'overdue-tasks',
        })
      );
    });

    it('期限切れタスクが複数件の場合は最大3件まで表示する', () => {
      NotificationMock.permission = 'granted';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      const tasks = [
        createMockTask('1', 'タスク1'),
        createMockTask('2', 'タスク2'),
        createMockTask('3', 'タスク3'),
        createMockTask('4', 'タスク4'),
      ];
      notifyOverdueTasks(tasks);

      expect(spy).toHaveBeenCalledWith(
        '期限切れのタスクが4件あります',
        expect.objectContaining({
          body: 'タスク1\nタスク2\nタスク3',
          tag: 'overdue-tasks',
        })
      );
    });
  });

  describe('notifyUpcomingTasks', () => {
    const createMockTask = (id: string, title: string): Task => ({
      id,
      title,
      description: '',
      columnId: 'todo',
      position: 0,
      priority: 'medium',
      assigneeIds: [],
      tagIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sync: {
        version: 1,
        lastModifiedAt: new Date().toISOString(),
        syncStatus: 'local',
      },
    });

    it('タスクが0件の場合は通知を表示しない', () => {
      NotificationMock.permission = 'granted';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      notifyUpcomingTasks([]);

      expect(spy).not.toHaveBeenCalled();
    });

    it('期限が近いタスクが複数件の場合は通知を表示する', () => {
      NotificationMock.permission = 'granted';
      const spy = vi.spyOn(globalThis as any, 'Notification');

      const tasks = [
        createMockTask('1', 'タスク1'),
        createMockTask('2', 'タスク2'),
      ];
      notifyUpcomingTasks(tasks);

      expect(spy).toHaveBeenCalledWith(
        '期限が近いタスクが2件あります',
        expect.objectContaining({
          body: 'タスク1\nタスク2',
          tag: 'upcoming-tasks',
        })
      );
    });
  });
});
