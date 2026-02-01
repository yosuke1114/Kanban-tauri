import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarView from './CalendarView';
import type { Member } from '@/types';
import { resetStore, createMockTask, createMockMember, addTaskToStore, addMemberToStore } from '@/test-utils/mockStore';

describe('CalendarView', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('基本表示', () => {
    it('カレンダータイトルが表示される', () => {
      render(<CalendarView />);

      expect(screen.getByText('カレンダー')).toBeInTheDocument();
    });

    it('タスク件数が表示される', () => {
      render(<CalendarView />);

      expect(screen.getByText(/件のタスク/)).toBeInTheDocument();
    });

    it('タスクがない場合にメッセージが表示される', () => {
      render(<CalendarView />);

      expect(screen.getByText('この日のタスクはありません')).toBeInTheDocument();
    });
  });

  describe('タスク表示', () => {
    it('期限があるタスクが表示される', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const task = createMockTask({
        id: 'task-1',
        title: '今日のタスク',
        dueDate,
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('今日のタスク')).toBeInTheDocument();
    });

    it('タスクタイトルが表示される', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const task = createMockTask({
        id: 'task-1',
        title: 'カレンダータスク',
        dueDate,
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('カレンダータスク')).toBeInTheDocument();
    });

    it('タスク説明が表示される', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        description: 'タスクの詳細説明',
        dueDate,
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('タスクの詳細説明')).toBeInTheDocument();
    });

    it('優先度ラベルが表示される', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const tasks = [
        createMockTask({ id: 'task-1', title: 'タスク1', priority: 'low', dueDate }),
        createMockTask({ id: 'task-2', title: 'タスク2', priority: 'medium', dueDate }),
        createMockTask({ id: 'task-3', title: 'タスク3', priority: 'high', dueDate }),
        createMockTask({ id: 'task-4', title: 'タスク4', priority: 'urgent', dueDate }),
      ];

      store.tasks = Object.fromEntries(tasks.map((t) => [t.id, t]));
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('低')).toBeInTheDocument();
      expect(screen.getByText('中')).toBeInTheDocument();
      expect(screen.getByText('高')).toBeInTheDocument();
      expect(screen.getByText('緊急')).toBeInTheDocument();
    });

    it('担当者が表示される', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        assigneeIds: ['member-1'],
        dueDate,
      });

      store.members = { [member.id]: member };
      store.tasks = { [task.id]: task };
      useBoardStore.setState({ members: store.members, tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
    });

    it('複数のタスクが表示される', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const tasks = [
        createMockTask({ id: 'task-1', title: 'タスク1', dueDate }),
        createMockTask({ id: 'task-2', title: 'タスク2', dueDate }),
        createMockTask({ id: 'task-3', title: 'タスク3', dueDate }),
      ];

      store.tasks = Object.fromEntries(tasks.map((t) => [t.id, t]));
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('タスク1')).toBeInTheDocument();
      expect(screen.getByText('タスク2')).toBeInTheDocument();
      expect(screen.getByText('タスク3')).toBeInTheDocument();
      expect(screen.getByText('3件のタスク')).toBeInTheDocument();
    });
  });

  describe('タスククリック', () => {
    it('タスクをクリックでEditTaskDialogが開く', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const task = createMockTask({
        id: 'task-1',
        title: 'クリック可能なタスク',
        dueDate,
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      const taskElement = screen.getByText('クリック可能なタスク');
      await user.click(taskElement);

      // EditTaskDialogが開く
      expect(screen.getByText('タスクを編集')).toBeInTheDocument();
    });
  });

  describe('期限なしタスク', () => {
    it('期限がないタスクは表示されない', () => {
      const store = useBoardStore.getState();

      const task = createMockTask({
        id: 'task-1',
        title: '期限なしタスク',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.queryByText('期限なしタスク')).not.toBeInTheDocument();
      expect(screen.getByText('この日のタスクはありません')).toBeInTheDocument();
    });
  });

  describe('異なる日付のタスク', () => {
    it('異なる日付のタスクは表示されない', () => {
      const store = useBoardStore.getState();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const task = createMockTask({
        id: 'task-1',
        title: '明日のタスク',
        dueDate,
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      // 今日の日付が選択されているので、明日のタスクは表示されない
      expect(screen.queryByText('明日のタスク')).not.toBeInTheDocument();
    });
  });

  describe('件数表示', () => {
    it('0件のタスク表示', () => {
      render(<CalendarView />);

      expect(screen.getByText('0件のタスク')).toBeInTheDocument();
    });

    it('1件のタスク表示', () => {
      const store = useBoardStore.getState();
      const today = new Date();
      const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const task = createMockTask({ id: 'task-1', title: 'タスク1', dueDate });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<CalendarView />);

      expect(screen.getByText('1件のタスク')).toBeInTheDocument();
    });
  });
});
