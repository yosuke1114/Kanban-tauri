import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
// @ts-expect-error - screen is exported from @testing-library/react
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from './FilterPanel';
import { useBoardStore } from '@/stores/useBoardStore';

// ストアのリセット用ヘルパー
const resetStore = () => {
  const store = useBoardStore.getState();
  store.tasks = {};
  store.members = {};
  store.tags = {};
  store.filters = {
    tagIds: [],
    assigneeIds: [],
    priorities: [],
  };
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
      const tagId = Object.keys(useBoardStore.getState().tags)[0];
      expect(filters.tagIds).toContain(tagId);
    });

    it('選択したタグを解除できる', async () => {
      const user = userEvent.setup();
      const { addTag, setFilters } = useBoardStore.getState();

      addTag('バグ', '#ff0000');
      const tagId = Object.keys(useBoardStore.getState().tags)[0];
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

      const tagId = Object.keys(useBoardStore.getState().tags)[0];
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
      const tagId = Object.keys(useBoardStore.getState().tags)[0];

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
