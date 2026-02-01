import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from './AppHeader';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Member } from '@/types';
import { resetStore, createMockMember, addMemberToStore } from '@/test-utils/mockStore';

describe('AppHeader', () => {
  let onOpenMemberManager: ReturnType<typeof vi.fn>;
  let onOpenTagManager: ReturnType<typeof vi.fn>;
  let onOpenColumnManager: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetStore();
    onOpenMemberManager = vi.fn();
    onOpenTagManager = vi.fn();
    onOpenColumnManager = vi.fn();
  });

  describe('基本表示', () => {
    it('タイトルが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    });

    it('タスク追加フォームが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      expect(screen.getByTestId('new-task-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('新しいタスクを追加...')).toBeInTheDocument();
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
    });

    it('検索バーが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      expect(screen.getByRole('textbox', { name: 'タスク検索' })).toBeInTheDocument();
    });

    it('管理ボタンが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      expect(screen.getByText('列の管理')).toBeInTheDocument();
      expect(screen.getByText('メンバー管理')).toBeInTheDocument();
      expect(screen.getByText('タグ管理')).toBeInTheDocument();
    });
  });

  describe('タスク追加', () => {
    it('タスクタイトルを入力できる', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const input = screen.getByTestId('new-task-input') as HTMLInputElement;

      await user.type(input, 'テストタスク');

      expect(input.value).toBe('テストタスク');
    });

    it('フォーム送信でタスクが追加される', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const input = screen.getByTestId('new-task-input');
      const addButton = screen.getByTestId('add-task-button');

      await user.type(input, '新しいタスク');
      await user.click(addButton);

      await waitFor(() => {
        const store = useBoardStore.getState();
        const board = store.boards[store.currentBoardId];
        const task = Object.values(board?.tasks || {}).find((t) => t.title === '新しいタスク');
        expect(task).toBeDefined();
        expect(task?.columnId).toBe('todo');
      });
    });

    it('タスク追加後に入力欄がクリアされる', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const input = screen.getByTestId('new-task-input') as HTMLInputElement;
      const addButton = screen.getByTestId('add-task-button');

      await user.type(input, '新しいタスク');
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('空のタスクは追加されない', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const addButton = screen.getByTestId('add-task-button');
      const state1 = useBoardStore.getState();
      const board1 = state1.boards[state1.currentBoardId];
      const initialTaskCount = Object.keys(board1?.tasks || {}).length;

      await user.click(addButton);

      const state2 = useBoardStore.getState();
      const board2 = state2.boards[state2.currentBoardId];
      const finalTaskCount = Object.keys(board2?.tasks || {}).length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });

    it('空白のみのタスクは追加されない', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const input = screen.getByTestId('new-task-input');
      const addButton = screen.getByTestId('add-task-button');
      const state1 = useBoardStore.getState();
      const board1 = state1.boards[state1.currentBoardId];
      const initialTaskCount = Object.keys(board1?.tasks || {}).length;

      await user.type(input, '   ');
      await user.click(addButton);

      const state2 = useBoardStore.getState();
      const board2 = state2.boards[state2.currentBoardId];
      const finalTaskCount = Object.keys(board2?.tasks || {}).length;
      expect(finalTaskCount).toBe(initialTaskCount);
    });
  });

  describe('検索機能', () => {
    it('検索クエリが更新される', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const searchInput = screen.getByRole('textbox', { name: 'タスク検索' });

      await user.type(searchInput, 'test');

      await waitFor(() => {
        const store = useBoardStore.getState();
        expect(store.searchQuery).toBe('test');
      });
    });
  });

  describe('ユーザー選択', () => {
    it.skip('ユーザーセレクターが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      expect(screen.getByTestId('user-select-trigger')).toBeInTheDocument();
    });

    it.skip('メンバーが登録されている場合、選択肢に表示される', () => {
      const member = createMockMember({
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
      });

      addMemberToStore(member);

      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      // Note: Selectコンポーネントのテストはjsdomの制限により難しい
      // 実際の動作はE2Eテストで確認
    });
  });

  describe('自分のタスクトグル', () => {
    it('ユーザー未選択時は無効化されている', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const toggleButton = screen.getByTestId('my-tasks-toggle');
      expect(toggleButton).toBeDisabled();
    });

    it('自分のタスクボタンが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      expect(screen.getByText('自分のタスク')).toBeInTheDocument();
    });
  });

  describe('管理ダイアログボタン', () => {
    it('列の管理ボタンクリックでコールバックが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const button = screen.getByTestId('open-column-manager');
      await user.click(button);

      expect(onOpenColumnManager).toHaveBeenCalledTimes(1);
    });

    it('メンバー管理ボタンクリックでコールバックが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const button = screen.getByTestId('open-member-manager');
      await user.click(button);

      expect(onOpenMemberManager).toHaveBeenCalledTimes(1);
    });

    it('タグ管理ボタンクリックでコールバックが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
        />
      );

      const button = screen.getByTestId('open-tag-manager');
      await user.click(button);

      expect(onOpenTagManager).toHaveBeenCalledTimes(1);
    });
  });

  describe('refの転送', () => {
    it('taskInputRefが正しく転送される', () => {
      const taskInputRef = { current: null as HTMLInputElement | null };

      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
          taskInputRef={taskInputRef}
        />
      );

      expect(taskInputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(taskInputRef.current?.type).toBe('text');
    });

    it('searchInputRefが正しく転送される', () => {
      const searchInputRef = { current: null as HTMLInputElement | null };

      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
          searchInputRef={searchInputRef}
        />
      );

      expect(searchInputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(searchInputRef.current?.type).toBe('text');
    });
  });
});
