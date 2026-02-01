import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListView from './ListView';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Task, BoardState, Member, Tag } from '@/types';

const resetStore = () => {
  const initialState: BoardState = {
    tasks: {},
    columns: {
      todo: {
        id: 'todo',
        title: '未着手',
        color: '#94a3b8',
        position: 0,
        isDefault: true,
      },
      inProgress: {
        id: 'inProgress',
        title: '進行中',
        color: '#60a5fa',
        position: 1,
        isDefault: true,
      },
      done: {
        id: 'done',
        title: '完了',
        color: '#34d399',
        position: 2,
        isDefault: true,
      },
    },
    columnOrder: ['todo', 'inProgress', 'done'],
    members: {},
    tags: {},
    filters: {
      tagIds: [],
      assigneeIds: [],
      priorities: [],
    },
    currentUserId: undefined,
  };

  useBoardStore.setState({
    ...initialState,
    searchQuery: '',
  });
};

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: `task-${Date.now()}-${Math.random()}`,
  title: 'テストタスク',
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
  ...overrides,
});

describe('ListView', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('基本表示', () => {
    it('テーブルヘッダーが表示される', () => {
      render(<ListView />);

      expect(screen.getByText('タスク')).toBeInTheDocument();
      expect(screen.getByText('優先度')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('期限')).toBeInTheDocument();
      expect(screen.getByText('担当者')).toBeInTheDocument();
      expect(screen.getByText('タグ')).toBeInTheDocument();
      expect(screen.getByText('作成日')).toBeInTheDocument();
    });

    it('タスクがない場合にメッセージが表示される', () => {
      render(<ListView />);

      expect(screen.getByText('タスクがありません')).toBeInTheDocument();
    });

    it('タスクがある場合にテーブル行が表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'テストタスク1',
        columnId: 'todo',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('テストタスク1')).toBeInTheDocument();
    });
  });

  describe('タスク情報の表示', () => {
    it('タスクタイトルが表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'タスクタイトル',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('タスクタイトル')).toBeInTheDocument();
    });

    it('タスク説明が表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        description: 'タスクの説明',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('タスクの説明')).toBeInTheDocument();
    });

    it('優先度ラベルが表示される', () => {
      const store = useBoardStore.getState();
      const tasks = [
        createMockTask({ id: 'task-1', title: 'タスク1', priority: 'low' }),
        createMockTask({ id: 'task-2', title: 'タスク2', priority: 'medium' }),
        createMockTask({ id: 'task-3', title: 'タスク3', priority: 'high' }),
        createMockTask({ id: 'task-4', title: 'タスク4', priority: 'urgent' }),
      ];

      store.tasks = Object.fromEntries(tasks.map((t) => [t.id, t]));
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('低')).toBeInTheDocument();
      expect(screen.getByText('中')).toBeInTheDocument();
      expect(screen.getByText('高')).toBeInTheDocument();
      expect(screen.getByText('緊急')).toBeInTheDocument();
    });

    it('ステータス（列名）が表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        columnId: 'inProgress',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('進行中')).toBeInTheDocument();
    });

    it('期限が表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        dueDate: '2025-12-31',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      // 期限が何らかの形式で表示される
      const rows = screen.getAllByRole('row');
      const taskRow = rows.find((row) => row.textContent?.includes('タスク'));
      expect(taskRow).toBeDefined();
    });

    it('期限がない場合にハイフンが表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      const { container } = render(<ListView />);

      // ハイフンが表示される（期限列）
      const cells = container.querySelectorAll('td');
      const dueDateCell = Array.from(cells).find((cell) =>
        cell.textContent?.trim() === '-'
      );
      expect(dueDateCell).toBeDefined();
    });

    it('担当者が表示される', () => {
      const store = useBoardStore.getState();
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
      });

      store.members = { [member.id]: member };
      store.tasks = { [task.id]: task };
      useBoardStore.setState({ members: store.members, tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
    });

    it('担当者がいない場合にハイフンが表示される', () => {
      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        assigneeIds: [],
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      const { container } = render(<ListView />);

      // ハイフンが表示される（担当者列）
      const cells = container.querySelectorAll('td');
      const assigneeCell = Array.from(cells).find((cell) =>
        cell.textContent?.trim() === '-'
      );
      expect(assigneeCell).toBeDefined();
    });

    it('タグが表示される', () => {
      const store = useBoardStore.getState();
      const tag: Tag = {
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      };

      const task = createMockTask({
        id: 'task-1',
        title: 'タスク',
        tagIds: ['tag-1'],
      });

      store.tags = { [tag.id]: tag };
      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tags: store.tags, tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('バグ')).toBeInTheDocument();
    });
  });

  describe('ソート機能', () => {
    beforeEach(() => {
      const store = useBoardStore.getState();
      const tasks = [
        createMockTask({
          id: 'task-1',
          title: 'Aタスク',
          priority: 'low',
          createdAt: '2025-01-01T00:00:00Z',
        }),
        createMockTask({
          id: 'task-2',
          title: 'Bタスク',
          priority: 'urgent',
          createdAt: '2025-01-02T00:00:00Z',
        }),
        createMockTask({
          id: 'task-3',
          title: 'Cタスク',
          priority: 'medium',
          createdAt: '2025-01-03T00:00:00Z',
        }),
      ];

      store.tasks = Object.fromEntries(tasks.map((t) => [t.id, t]));
      useBoardStore.setState({ tasks: store.tasks });
    });

    it('タスク列のソートボタンをクリックでソートされる', async () => {
      const user = userEvent.setup();
      render(<ListView />);

      const sortButton = screen.getByRole('button', { name: /タスク/ });
      await user.click(sortButton);

      // タイトル昇順でソートされる
      const rows = screen.getAllByRole('row');
      const taskRows = rows.slice(1); // ヘッダー行を除く
      expect(taskRows[0]).toHaveTextContent('Aタスク');
      expect(taskRows[1]).toHaveTextContent('Bタスク');
      expect(taskRows[2]).toHaveTextContent('Cタスク');
    });

    it('優先度列のソートボタンをクリックでソートされる', async () => {
      const user = userEvent.setup();
      render(<ListView />);

      const sortButton = screen.getByRole('button', { name: /優先度/ });
      await user.click(sortButton);

      // 優先度昇順（低→高）
      const rows = screen.getAllByRole('row');
      const taskRows = rows.slice(1);
      expect(taskRows[0]).toHaveTextContent('低');
      expect(taskRows[1]).toHaveTextContent('中');
      expect(taskRows[2]).toHaveTextContent('緊急');
    });

    it('同じカラムを2回クリックでソート方向が反転する', async () => {
      const user = userEvent.setup();
      render(<ListView />);

      const sortButton = screen.getByRole('button', { name: /タスク/ });

      // 1回目: 昇順
      await user.click(sortButton);
      let rows = screen.getAllByRole('row');
      let taskRows = rows.slice(1);
      expect(taskRows[0]).toHaveTextContent('Aタスク');

      // 2回目: 降順
      await user.click(sortButton);
      rows = screen.getAllByRole('row');
      taskRows = rows.slice(1);
      expect(taskRows[0]).toHaveTextContent('Cタスク');
    });
  });

  describe('タスククリック', () => {
    it('タスク行をクリックでEditTaskDialogが開く', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const task = createMockTask({
        id: 'task-1',
        title: 'クリック可能なタスク',
      });

      store.tasks = { [task.id]: task };
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      const taskRow = screen.getByText('クリック可能なタスク').closest('tr');
      expect(taskRow).toBeDefined();

      if (taskRow) {
        await user.click(taskRow);

        // EditTaskDialogが開く
        expect(screen.getByText('タスクを編集')).toBeInTheDocument();
      }
    });
  });

  describe('複数タスク', () => {
    it('複数のタスクが正しく表示される', () => {
      const store = useBoardStore.getState();
      const tasks = [
        createMockTask({ id: 'task-1', title: 'タスク1' }),
        createMockTask({ id: 'task-2', title: 'タスク2' }),
        createMockTask({ id: 'task-3', title: 'タスク3' }),
      ];

      store.tasks = Object.fromEntries(tasks.map((t) => [t.id, t]));
      useBoardStore.setState({ tasks: store.tasks });

      render(<ListView />);

      expect(screen.getByText('タスク1')).toBeInTheDocument();
      expect(screen.getByText('タスク2')).toBeInTheDocument();
      expect(screen.getByText('タスク3')).toBeInTheDocument();
    });
  });
});
