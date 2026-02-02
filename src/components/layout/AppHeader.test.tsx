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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    });

    it('タスク追加ボタンが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      expect(screen.getByText('タスク追加')).toBeInTheDocument();
    });

    it('検索バーが表示される', () => {
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      expect(screen.getByText('管理')).toBeInTheDocument();
    });
  });

  describe('タスク追加', () => {
    it('タスク追加ボタンクリックでコールバックが呼ばれる', async () => {
      const user = userEvent.setup();
      const onAddNewTask = vi.fn();
      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={onAddNewTask}
        />
      );

      const addTaskButton = screen.getByTestId('add-task-button');
      await user.click(addTaskButton);

      expect(onAddNewTask).toHaveBeenCalledTimes(1);
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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      // Note: Selectコンポーネントのテストはjsdomの制限により難しい
      // 実際の動作はE2Eテストで確認
    });
  });

  describe.skip('自分のタスクトグル（削除された機能）', () => {
    it('ユーザー未選択時は無効化されている', () => {
      // 削除された機能
    });

    it('自分のタスクボタンが表示される', () => {
      // 削除された機能
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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      // DropdownMenuを開く
      const menuButton = screen.getByText('管理');
      await user.click(menuButton);

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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      // DropdownMenuを開く
      const menuButton = screen.getByText('管理');
      await user.click(menuButton);

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
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
        />
      );

      // DropdownMenuを開く
      const menuButton = screen.getByText('管理');
      await user.click(menuButton);

      const button = screen.getByTestId('open-tag-manager');
      await user.click(button);

      expect(onOpenTagManager).toHaveBeenCalledTimes(1);
    });
  });

  describe('refの転送', () => {
    it('searchInputRefが正しく転送される', () => {
      const searchInputRef = { current: null as HTMLInputElement | null };

      render(
        <AppHeader
          onOpenMemberManager={onOpenMemberManager}
          onOpenTagManager={onOpenTagManager}
          onOpenColumnManager={onOpenColumnManager}
          onOpenTrashManager={vi.fn()}
          onOpenBoardManager={vi.fn()}
          onAddNewTask={vi.fn()}
          searchInputRef={searchInputRef}
        />
      );

      expect(searchInputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(searchInputRef.current?.type).toBe('text');
    });
  });
});
