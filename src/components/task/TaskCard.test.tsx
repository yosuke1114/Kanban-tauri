import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskCard from './TaskCard';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Task } from '@/types';

const DEFAULT_BOARD_ID = 'default';

const createDefaultColumns = () => ({
  todo: { id: 'todo', title: '未着手', color: '#94a3b8', position: 0, isDefault: true },
  inProgress: { id: 'inProgress', title: '進行中', color: '#60a5fa', position: 1, isDefault: true },
  done: { id: 'done', title: '完了', color: '#34d399', position: 2, isDefault: true },
});

// ストアのリセット用ヘルパー（マルチボード対応）
const resetStore = () => {
  const now = new Date().toISOString();
  useBoardStore.setState({
    boards: {
      [DEFAULT_BOARD_ID]: {
        id: DEFAULT_BOARD_ID,
        name: 'メインボード',
        description: '',
        tasks: {},
        columns: createDefaultColumns(),
        columnOrder: ['todo', 'inProgress', 'done'],
        tags: {},
        createdAt: now,
        updatedAt: now,
      },
    },
    boardOrder: [DEFAULT_BOARD_ID],
    currentBoardId: DEFAULT_BOARD_ID,
    members: {},
    currentUserId: undefined,
    filters: {
      tagIds: [],
      assigneeIds: [],
      priorities: [],
    },
    searchQuery: '',
  });
};

const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'test-task-1',
  title: 'テストタスク',
  description: 'テストタスクの説明',
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

describe('TaskCard', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('タスク表示', () => {
    it('タスクのタイトルを表示する', () => {
      const task = createMockTask();

      render(<TaskCard task={task} />);

      expect(screen.getByText('テストタスク')).toBeInTheDocument();
    });

    it('タスクの説明を表示する', () => {
      const task = createMockTask();

      render(<TaskCard task={task} />);

      expect(screen.getByText('テストタスクの説明')).toBeInTheDocument();
    });

    it('説明がない場合は説明を表示しない', () => {
      const task = createMockTask({ description: '' });

      render(<TaskCard task={task} />);

      expect(screen.queryByText('テストタスクの説明')).not.toBeInTheDocument();
    });
  });

  describe('優先度バッジ', () => {
    it('低優先度のバッジを表示する', () => {
      const task = createMockTask({ priority: 'low' });

      render(<TaskCard task={task} />);

      expect(screen.getByText('低')).toBeInTheDocument();
    });

    it('中優先度のバッジを表示する', () => {
      const task = createMockTask({ priority: 'medium' });

      render(<TaskCard task={task} />);

      expect(screen.getByText('中')).toBeInTheDocument();
    });

    it('高優先度のバッジを表示する', () => {
      const task = createMockTask({ priority: 'high' });

      render(<TaskCard task={task} />);

      expect(screen.getByText('高')).toBeInTheDocument();
    });

    it('緊急優先度のバッジを表示する', () => {
      const task = createMockTask({ priority: 'urgent' });

      render(<TaskCard task={task} />);

      expect(screen.getByText('緊急')).toBeInTheDocument();
    });
  });

  describe('期限ステータス', () => {
    it('期限切れのタスクを表示する', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const task = createMockTask({ dueDate: yesterday.toISOString() });

      render(<TaskCard task={task} />);

      expect(screen.getByText(/期限切れ/)).toBeInTheDocument();
    });

    it('今日が期限のタスクを表示する', () => {
      const today = new Date();
      const task = createMockTask({ dueDate: today.toISOString() });

      render(<TaskCard task={task} />);

      expect(screen.getByText(/今日/)).toBeInTheDocument();
    });

    it('期限が間近のタスクを表示する', () => {
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const task = createMockTask({ dueDate: threeDaysLater.toISOString() });

      render(<TaskCard task={task} />);

      expect(screen.getByText(/期限間近/)).toBeInTheDocument();
    });

    it('期限が先のタスクは特別なステータスを表示しない', () => {
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const task = createMockTask({ dueDate: sevenDaysLater.toISOString() });

      render(<TaskCard task={task} />);

      expect(screen.queryByText(/期限切れ/)).not.toBeInTheDocument();
      expect(screen.queryByText(/今日/)).not.toBeInTheDocument();
      expect(screen.queryByText(/期限間近/)).not.toBeInTheDocument();
    });

    it('期限がない場合は期限を表示しない', () => {
      const task = createMockTask({ dueDate: undefined });

      render(<TaskCard task={task} />);

      // Calendarアイコンが存在しないことを確認
      const calendarIcons = screen.queryAllByTestId('lucide-calendar');
      expect(calendarIcons).toHaveLength(0);
    });
  });

  // ヘルパー: 現在のボードのタグを取得
  const getTags = () => {
    const state = useBoardStore.getState();
    return state.boards[state.currentBoardId]?.tags || {};
  };

  describe('タグ表示', () => {
    it('タグを表示する', () => {
      const { addTag } = useBoardStore.getState();
      addTag('バグ', '#ff0000');
      addTag('機能', '#00ff00');

      const tagIds = Object.keys(getTags());
      const task = createMockTask({ tagIds });

      render(<TaskCard task={task} />);

      expect(screen.getByText('バグ')).toBeInTheDocument();
      expect(screen.getByText('機能')).toBeInTheDocument();
    });

    it('タグがない場合はタグを表示しない', () => {
      const task = createMockTask({ tagIds: [] });

      render(<TaskCard task={task} />);

      // 優先度バッジのみ表示されている
      expect(screen.getByText('中')).toBeInTheDocument();
    });
  });

  describe('担当者表示', () => {
    it('担当者を表示する', () => {
      const { addMember } = useBoardStore.getState();
      addMember('田中太郎', '#0000ff');
      addMember('佐藤花子', '#ffff00');

      const memberIds = Object.keys(useBoardStore.getState().members);
      const task = createMockTask({ assigneeIds: memberIds });

      render(<TaskCard task={task} />);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('佐藤花子')).toBeInTheDocument();
    });

    it('担当者がいない場合は担当者を表示しない', () => {
      const task = createMockTask({ assigneeIds: [] });

      render(<TaskCard task={task} />);

      // Userアイコンが存在しないことを確認
      const userIcons = screen.queryAllByTestId('lucide-user');
      expect(userIcons).toHaveLength(0);
    });
  });
});
