import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagManager from './TagManager';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Tag } from '@/types';
import { resetStore, createMockTag, addTagToStore } from '@/test-utils/mockStore';

describe('TagManager', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetStore();
    onClose = vi.fn();
  });

  describe('基本表示', () => {
    it('ダイアログが開いている時にタイトルが表示される', () => {
      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('タグ管理')).toBeInTheDocument();
      expect(screen.getByText('タスクに設定するタグを追加・編集します')).toBeInTheDocument();
    });

    it('ダイアログが閉じている時は何も表示されない', () => {
      const { container } = render(<TagManager open={false} onClose={onClose} />);

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('タグ入力フィールドが表示される', () => {
      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByTestId('tag-name-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('タグ名を入力')).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByTestId('add-tag-button')).toBeInTheDocument();
    });

    it('8つのカラーオプションが表示される', () => {
      render(<TagManager open={true} onClose={onClose} />);

      const colorOptions = [
        '#ef4444',
        '#f59e0b',
        '#10b981',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#14b8a6',
        '#f97316',
      ];

      colorOptions.forEach((color) => {
        expect(screen.getByTestId(`color-option-${color}`)).toBeInTheDocument();
      });
    });
  });

  describe('タグの追加', () => {
    it('タグ名を入力して追加できる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('tag-name-input');
      const addButton = screen.getByTestId('add-tag-button');

      await user.type(input, 'バグ');
      await user.click(addButton);

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        const bugTag = Object.values(board?.tags || {}).find((tag) => tag.name === 'バグ');
        expect(bugTag).toBeDefined();
        expect(bugTag?.color).toBe('#ef4444'); // デフォルトカラー
      });
    });

    it('Enterキーでタグを追加できる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('tag-name-input');

      await user.type(input, '機能{Enter}');

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        const featureTag = Object.values(board?.tags || {}).find((tag) => tag.name === '機能');
        expect(featureTag).toBeDefined();
      });
    });

    it('空のタグ名では追加できない', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const addButton = screen.getByTestId('add-tag-button');
      const initialTagCount = Object.keys(useBoardStore.getState().tags).length;

      await user.click(addButton);

      const finalTagCount = Object.keys(useBoardStore.getState().tags).length;
      expect(finalTagCount).toBe(initialTagCount);
    });

    it('タグ追加後に入力欄がクリアされる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('tag-name-input') as HTMLInputElement;
      const addButton = screen.getByTestId('add-tag-button');

      await user.type(input, '新しいタグ');
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('選択したカラーでタグを追加できる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      // カラーを選択（ブルー）
      const blueButton = screen.getByTestId('color-option-#3b82f6');
      await user.click(blueButton);

      // タグを追加
      const input = screen.getByTestId('tag-name-input');
      const addButton = screen.getByTestId('add-tag-button');

      await user.type(input, 'ブルータグ');
      await user.click(addButton);

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        const blueTag = Object.values(board?.tags || {}).find((tag) => tag.name === 'ブルータグ');
        expect(blueTag?.color).toBe('#3b82f6');
      });
    });

    it('タグ追加後に選択カラーがリセットされる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      // カラーを選択
      const greenButton = screen.getByTestId('color-option-#10b981');
      await user.click(greenButton);

      // タグを追加
      const input = screen.getByTestId('tag-name-input');
      const addButton = screen.getByTestId('add-tag-button');

      await user.type(input, 'グリーンタグ');
      await user.click(addButton);

      // 次のタグを追加時、デフォルトカラーが選択されている
      await user.type(input, '次のタグ');
      await user.click(addButton);

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        const nextTag = Object.values(board?.tags || {}).find((tag) => tag.name === '次のタグ');
        expect(nextTag?.color).toBe('#ef4444'); // デフォルトカラー
      });
    });
  });

  describe('タグの表示', () => {
    it('登録済みタグが表示される', () => {
      const tag1 = createMockTag({
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      });
      const tag2 = createMockTag({
        id: 'tag-2',
        name: '機能',
        color: '#10b981',
      });

      addTagToStore(tag1);
      addTagToStore(tag2);

      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('バグ')).toBeInTheDocument();
      expect(screen.getByText('機能')).toBeInTheDocument();
    });

    it('タグがない場合にメッセージが表示される', () => {
      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('タグが登録されていません')).toBeInTheDocument();
    });

    it('タグのカラーが正しく表示される', () => {
      const tag = createMockTag({
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      });

      addTagToStore(tag);

      render(<TagManager open={true} onClose={onClose} />);

      const tagItem = screen.getByTestId('tag-item-tag-1');
      expect(tagItem).toHaveStyle({ borderColor: 'rgb(239, 68, 68)' });
    });
  });

  describe('タグの削除', () => {
    it('削除ボタンで確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      const tag = createMockTag({
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      });

      addTagToStore(tag);

      render(<TagManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-tag-tag-1');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('タグを削除しますか？')).toBeInTheDocument();
        expect(screen.getByText(/タグ「バグ」が完全に削除され/)).toBeInTheDocument();
      });
    });

    it('削除確認でタグが削除される', async () => {
      const user = userEvent.setup();

      const tag = createMockTag({
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      });

      addTagToStore(tag);

      render(<TagManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-tag-tag-1');
      await user.click(deleteButton);

      // 確認ダイアログの削除ボタン
      const confirmButton = await screen.findByRole('button', { name: '削除' });
      await user.click(confirmButton);

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        expect(board?.tags['tag-1']).toBeUndefined();
      });
    });

    it('削除キャンセルでタグは削除されない', async () => {
      const user = userEvent.setup();

      const tag = createMockTag({
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      });

      addTagToStore(tag);

      render(<TagManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-tag-tag-1');
      await user.click(deleteButton);

      const cancelButton = await screen.findByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        expect(board?.tags['tag-1']).toBeDefined();
      });
    });
  });

  describe('カラー選択', () => {
    it('カラーを選択できる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const blueButton = screen.getByTestId('color-option-#3b82f6');

      await user.click(blueButton);

      // 選択されたカラーのボタンが強調表示される
      await waitFor(() => {
        expect(blueButton.className).toContain('border-primary');
        expect(blueButton.className).toContain('scale-110');
      });
    });

    it('異なるカラーを選択すると前の選択が解除される', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const redButton = screen.getByTestId('color-option-#ef4444');
      const blueButton = screen.getByTestId('color-option-#3b82f6');

      // 最初はレッドが選択されている（デフォルト）
      expect(redButton.className).toContain('border-primary');

      // ブルーを選択
      await user.click(blueButton);

      await waitFor(() => {
        expect(blueButton.className).toContain('border-primary');
        expect(redButton.className).not.toContain('border-primary');
      });
    });
  });

  describe('ダイアログの開閉', () => {
    it('閉じるボタンでダイアログを閉じる', async () => {
      const user = userEvent.setup();
      render(<TagManager open={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '閉じる' });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ダイアログ外クリックで閉じる', async () => {
      const user = userEvent.setup();
      const { container } = render(<TagManager open={true} onClose={onClose} />);

      // ダイアログのオーバーレイ部分をクリック
      const overlay = container.querySelector('[data-radix-dialog-overlay]');
      if (overlay) {
        await user.click(overlay);

        await waitFor(() => {
          expect(onClose).toHaveBeenCalled();
        });
      }
    });
  });

  describe('複数のタグ', () => {
    it('複数のタグが正しく表示される', () => {
      const tags = [
        createMockTag({ id: 'tag-1', name: 'バグ', color: '#ef4444' }),
        createMockTag({ id: 'tag-2', name: '機能', color: '#10b981' }),
        createMockTag({ id: 'tag-3', name: '改善', color: '#3b82f6' }),
        createMockTag({ id: 'tag-4', name: 'ドキュメント', color: '#8b5cf6' }),
      ];

      tags.forEach(tag => addTagToStore(tag));

      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('バグ')).toBeInTheDocument();
      expect(screen.getByText('機能')).toBeInTheDocument();
      expect(screen.getByText('改善')).toBeInTheDocument();
      expect(screen.getByText('ドキュメント')).toBeInTheDocument();

      const state = useBoardStore.getState();
      const board = state.boards[state.currentBoardId];
      expect(Object.keys(board?.tags || {}).length).toBe(4);
    });
  });
});
