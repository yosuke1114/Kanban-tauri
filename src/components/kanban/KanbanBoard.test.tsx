import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from './KanbanBoard';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Task, Column } from '@/types';
import { resetStore, createMockTask, addTaskToStore, createMockMember, addMemberToStore } from '@/test-utils/mockStore';

// useViewportSize モックのセットアップ
const mockUseViewportSize = vi.fn(() => 'desktop');
const mockUseMediaQuery = vi.fn(() => false);

vi.mock('@/hooks/useMediaQuery', () => ({
  useViewportSize: () => mockUseViewportSize(),
  useMediaQuery: () => mockUseMediaQuery(),
  useIsMobile: () => mockUseMediaQuery(),
  useIsTablet: () => mockUseMediaQuery(),
  useIsDesktop: () => !mockUseMediaQuery(),
}));

// useSwipe モックのセットアップ
vi.mock('@/hooks/useSwipe', () => ({
  useSwipe: vi.fn(() => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  })),
}));

describe('KanbanBoard', () => {
  beforeEach(() => {
    resetStore();
    // モックをデフォルト値にリセット
    mockUseViewportSize.mockReturnValue('desktop');
    mockUseMediaQuery.mockReturnValue(false);

    // loadFromStorageとgenerateRecurringTasksをモック化
    useBoardStore.setState({
      loadFromStorage: vi.fn(async () => {}),
      generateRecurringTasks: vi.fn(),
    } as any);
  });

  describe('列の表示', () => {
    it('デフォルトの3つの列が表示される', () => {
      render(<KanbanBoard />);

      expect(screen.getByText('未着手')).toBeInTheDocument();
      expect(screen.getByText('進行中')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('列のタスク数が正しく表示される', () => {
      const task1 = createMockTask({ columnId: 'todo', position: 0 });
      const task2 = createMockTask({ columnId: 'todo', position: 1 });
      const task3 = createMockTask({ columnId: 'inProgress', position: 0 });

      addTaskToStore(task1);
      addTaskToStore(task2);
      addTaskToStore(task3);

      render(<KanbanBoard />);

      // 各列のタスク数バッジを確認
      const badges = screen.getAllByText(/^\d+$/);
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });

    it('カスタム列が追加されている場合も表示される', () => {
      const state = useBoardStore.getState();
      const board = state.boards[state.currentBoardId];

      if (board) {
        useBoardStore.setState({
          boards: {
            ...state.boards,
            [state.currentBoardId]: {
              ...board,
              columns: {
                ...board.columns,
                review: {
                  id: 'review',
                  title: 'レビュー中',
                  color: '#a78bfa',
                  position: 3,
                  isDefault: false,
                },
              },
              columnOrder: ['todo', 'inProgress', 'review', 'done'],
            },
          },
        });
      }

      render(<KanbanBoard />);

      expect(screen.getByText('レビュー中')).toBeInTheDocument();
    });
  });

  describe('タスクの表示', () => {
    it('各列にタスクが正しく表示される', () => {
      const todoTask = createMockTask({
        id: 'task-todo',
        title: '未着手タスク',
        columnId: 'todo',
        position: 0,
      });
      const progressTask = createMockTask({
        id: 'task-progress',
        title: '進行中タスク',
        columnId: 'inProgress',
        position: 0,
      });
      const doneTask = createMockTask({
        id: 'task-done',
        title: '完了タスク',
        columnId: 'done',
        position: 0,
      });

      addTaskToStore(todoTask);
      addTaskToStore(progressTask);
      addTaskToStore(doneTask);

      render(<KanbanBoard />);

      expect(screen.getByText('未着手タスク')).toBeInTheDocument();
      expect(screen.getByText('進行中タスク')).toBeInTheDocument();
      expect(screen.getByText('完了タスク')).toBeInTheDocument();
    });

    it('タスクがposition順にソートされて表示される', () => {
      const task1 = createMockTask({
        id: 'task-1',
        title: 'タスク1',
        columnId: 'todo',
        position: 2,
      });
      const task2 = createMockTask({
        id: 'task-2',
        title: 'タスク2',
        columnId: 'todo',
        position: 0,
      });
      const task3 = createMockTask({
        id: 'task-3',
        title: 'タスク3',
        columnId: 'todo',
        position: 1,
      });

      addTaskToStore(task1);
      addTaskToStore(task2);
      addTaskToStore(task3);

      render(<KanbanBoard />);

      const taskElements = screen.getAllByText(/^タスク[123]$/);
      expect(taskElements).toHaveLength(3);
      expect(taskElements[0]).toHaveTextContent('タスク2');
      expect(taskElements[1]).toHaveTextContent('タスク3');
      expect(taskElements[2]).toHaveTextContent('タスク1');
    });

    it('フィルター適用後は該当タスクのみ表示される', () => {
      // メンバーを作成
      const member1 = createMockMember({
        id: 'member-1',
        name: '田中',
        color: '#60a5fa',
      });
      addMemberToStore(member1);

      // タスクを作成
      const task1 = createMockTask({
        id: 'task-1',
        title: '田中のタスク',
        columnId: 'todo',
        assigneeIds: ['member-1'],
      });
      const task2 = createMockTask({
        id: 'task-2',
        title: '未割当タスク',
        columnId: 'todo',
        assigneeIds: [],
      });

      addTaskToStore(task1);
      addTaskToStore(task2);

      // フィルター適用（グローバルfilters）
      useBoardStore.setState({
        filters: {
          tagIds: [],
          assigneeIds: ['member-1'],
          priorities: [],
        },
      });

      render(<KanbanBoard />);

      expect(screen.getByText('田中のタスク')).toBeInTheDocument();
      expect(screen.queryByText('未割当タスク')).not.toBeInTheDocument();
    });
  });

  describe('初期データ読み込み', () => {
    it('コンポーネントマウント時にloadFromStorageが呼ばれる', async () => {
      const loadFromStorage = vi.fn();
      const generateRecurringTasks = vi.fn();

      useBoardStore.setState({
        loadFromStorage,
        generateRecurringTasks,
      } as any);

      render(<KanbanBoard />);

      await waitFor(() => {
        expect(loadFromStorage).toHaveBeenCalledTimes(1);
      });
    });

    it('データ読み込み後にgenerateRecurringTasksが呼ばれる', async () => {
      const loadFromStorage = vi.fn(async () => {});
      const generateRecurringTasks = vi.fn();

      useBoardStore.setState({
        loadFromStorage,
        generateRecurringTasks,
      } as any);

      render(<KanbanBoard />);

      await waitFor(() => {
        expect(generateRecurringTasks).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('モバイル表示', () => {
    beforeEach(() => {
      resetStore();
      mockUseViewportSize.mockReturnValue('mobile');
      mockUseMediaQuery.mockReturnValue(true); // isMobile = true
    });

    it('モバイルでスワイプインジケーターが表示される', () => {
      // loadFromStorageとgenerateRecurringTasksをモック化
      useBoardStore.setState({
        loadFromStorage: vi.fn(async () => {}),
        generateRecurringTasks: vi.fn(),
      } as any);

      render(<KanbanBoard />);

      expect(screen.getByText('左右にスワイプしてカラムを切り替え')).toBeInTheDocument();
    });

    it.skip('モバイルで最初のカラムが表示される', async () => {
      const task = createMockTask({
        id: 'task-1',
        title: 'モバイルタスク',
        columnId: 'todo',
      });

      addTaskToStore(task);

      // loadFromStorageとgenerateRecurringTasksをモック化（タスク追加後）
      useBoardStore.setState({
        loadFromStorage: vi.fn(async () => {}),
        generateRecurringTasks: vi.fn(),
      } as any);

      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByText('モバイルタスク')).toBeInTheDocument();
      });
    });
  });

  describe('レスポンシブ対応', () => {
    it('タブレット表示で横スクロール可能な2列レイアウト', () => {
      mockUseViewportSize.mockReturnValue('tablet');
      mockUseMediaQuery.mockReturnValue(false);

      const { container } = render(<KanbanBoard />);

      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('デスクトップ表示で全列が表示される', () => {
      mockUseViewportSize.mockReturnValue('desktop');
      mockUseMediaQuery.mockReturnValue(false);

      render(<KanbanBoard />);

      expect(screen.getByText('未着手')).toBeInTheDocument();
      expect(screen.getByText('進行中')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });
  });

  describe('タスクが空の場合', () => {
    it('タスクがない列でもヘッダーは表示される', () => {
      render(<KanbanBoard />);

      expect(screen.getByText('未着手')).toBeInTheDocument();
      expect(screen.getByText('進行中')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('タスクがない列のカウントは0と表示される', () => {
      render(<KanbanBoard />);

      const badges = screen.getAllByText('0');
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('サブタスク機能との連携', () => {
    it.skip('サブタスクを持つタスクが正しく表示される', async () => {
      const task = createMockTask({
        id: 'task-with-subtasks',
        title: 'サブタスクありタスク',
        columnId: 'todo',
        subtasks: [
          { id: 'sub-1', title: 'サブタスク1', completed: true },
          { id: 'sub-2', title: 'サブタスク2', completed: false },
        ],
      });

      addTaskToStore(task);

      // loadFromStorageとgenerateRecurringTasksをモック化（タスク追加後）
      useBoardStore.setState({
        loadFromStorage: vi.fn(async () => {}),
        generateRecurringTasks: vi.fn(),
      } as any);

      render(<KanbanBoard />);

      await waitFor(() => {
        expect(screen.getByText('サブタスクありタスク')).toBeInTheDocument();
      });
      // 進捗表示を確認
      expect(screen.getByText('1/2 完了')).toBeInTheDocument();
    });
  });
});
