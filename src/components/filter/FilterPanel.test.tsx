import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from './FilterPanel';
import { useBoardStore } from '@/stores/useBoardStore';

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

// ヘルパー: 現在のボードのタグを取得
const getTags = () => {
  const state = useBoardStore.getState();
  return state.boards[state.currentBoardId]?.tags || {};
};

describe('FilterPanel', () => {
  beforeEach(() => {
    resetStore();
  });

  it('フィルターボタンを表示する', () => {
    render(<FilterPanel />);

    expect(screen.getByText('フィルター')).toBeInTheDocument();
  });

  it('フィルターボタンをクリックするとポップオーバーが開く', async () => {
    const user = userEvent.setup();
    render(<FilterPanel />);

    await user.click(screen.getByText('フィルター'));

    expect(screen.getByText('タグ')).toBeInTheDocument();
    expect(screen.getByText('担当者')).toBeInTheDocument();
    expect(screen.getByText('優先度')).toBeInTheDocument();
  });

  describe('タグフィルター', () => {
    it('タグが存在しない場合は「タグがありません」と表示する', async () => {
      const user = userEvent.setup();
      render(<FilterPanel />);

      await user.click(screen.getByText('フィルター'));

      expect(screen.getByText('タグがありません')).toBeInTheDocument();
    });

    it('タグを選択できる', async () => {
      const user = userEvent.setup();
      const { addTag } = useBoardStore.getState();

      addTag('バグ', '#ff0000');
      addTag('機能', '#00ff00');

      render(<FilterPanel />);
      await user.click(screen.getByText('フィルター'));

      expect(screen.getByText('バグ')).toBeInTheDocument();
      expect(screen.getByText('機能')).toBeInTheDocument();

      // タグを選択
      await user.click(screen.getByText('バグ'));

      const filters = useBoardStore.getState().filters;
      const tagId = Object.keys(getTags())[0];
      expect(filters.tagIds).toContain(tagId);
    });

    it('選択したタグを解除できる', async () => {
      const user = userEvent.setup();
      const { addTag, setFilters } = useBoardStore.getState();

      addTag('バグ', '#ff0000');
      const tagId = Object.keys(getTags())[0];
      setFilters({ tagIds: [tagId] });

      render(<FilterPanel />);
      await user.click(screen.getByText('フィルター'));

      // タグを解除
      await user.click(screen.getByText('バグ'));

      const filters = useBoardStore.getState().filters;
      expect(filters.tagIds).not.toContain(tagId);
    });
  });

  describe('担当者フィルター', () => {
    it('メンバーが存在しない場合は「メンバーがいません」と表示する', async () => {
      const user = userEvent.setup();
      render(<FilterPanel />);

      await user.click(screen.getByText('フィルター'));

      expect(screen.getByText('メンバーがいません')).toBeInTheDocument();
    });

    it('担当者を選択できる', async () => {
      const user = userEvent.setup();
      const { addMember } = useBoardStore.getState();

      addMember('田中太郎', '#0000ff');
      addMember('佐藤花子', '#ffff00');

      render(<FilterPanel />);
      await user.click(screen.getByText('フィルター'));

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('佐藤花子')).toBeInTheDocument();

      // 担当者を選択
      await user.click(screen.getByText('田中太郎'));

      const filters = useBoardStore.getState().filters;
      const memberId = Object.keys(useBoardStore.getState().members)[0];
      expect(filters.assigneeIds).toContain(memberId);
    });
  });

  describe('優先度フィルター', () => {
    it('優先度を選択できる', async () => {
      const user = userEvent.setup();
      render(<FilterPanel />);

      await user.click(screen.getByText('フィルター'));

      // 優先度を選択
      await user.click(screen.getByText('高'));

      const filters = useBoardStore.getState().filters;
      expect(filters.priorities).toContain('high');
    });

    it('複数の優先度を選択できる', async () => {
      const user = userEvent.setup();
      render(<FilterPanel />);

      await user.click(screen.getByText('フィルター'));

      await user.click(screen.getByText('低'));
      await user.click(screen.getByText('高'));

      const filters = useBoardStore.getState().filters;
      expect(filters.priorities).toContain('low');
      expect(filters.priorities).toContain('high');
    });
  });

  describe('クリアボタン', () => {
    it('フィルターが選択されている場合、クリアボタンを表示する', async () => {
      const user = userEvent.setup();
      const { setFilters } = useBoardStore.getState();

      setFilters({ priorities: ['high'] });

      render(<FilterPanel />);
      await user.click(screen.getByText('フィルター'));

      expect(screen.getByText('クリア')).toBeInTheDocument();
    });

    it('クリアボタンをクリックすると全てのフィルターが解除される', async () => {
      const user = userEvent.setup();
      const { addTag, addMember, setFilters } = useBoardStore.getState();

      addTag('バグ', '#ff0000');
      addMember('田中太郎', '#0000ff');

      const tagId = Object.keys(getTags())[0];
      const memberId = Object.keys(useBoardStore.getState().members)[0];

      setFilters({
        tagIds: [tagId],
        assigneeIds: [memberId],
        priorities: ['high'],
      });

      render(<FilterPanel />);
      await user.click(screen.getByText('フィルター'));
      await user.click(screen.getByText('クリア'));

      const filters = useBoardStore.getState().filters;
      expect(filters.tagIds).toEqual([]);
      expect(filters.assigneeIds).toEqual([]);
      expect(filters.priorities).toEqual([]);
    });
  });

  describe('アクティブフィルター表示', () => {
    it('フィルターが選択されている場合、カウントを表示する', async () => {
      const { setFilters } = useBoardStore.getState();

      setFilters({ priorities: ['high', 'low'] });

      render(<FilterPanel />);

      // カウントバッジが表示される
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('複数種類のフィルターが選択されている場合、合計を表示する', async () => {
      const { addTag, setFilters } = useBoardStore.getState();

      addTag('バグ', '#ff0000');
      const tagId = Object.keys(getTags())[0];

      setFilters({
        tagIds: [tagId],
        priorities: ['high', 'low'],
      });

      render(<FilterPanel />);

      // 1 (tag) + 2 (priorities) = 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
