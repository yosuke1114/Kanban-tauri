import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagManager from './TagManager';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Tag, BoardState } from '@/types';

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
        const store = useBoardStore.getState();
        const bugTag = Object.values(store.tags).find((tag) => tag.name === 'バグ');
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
        const store = useBoardStore.getState();
        const featureTag = Object.values(store.tags).find((tag) => tag.name === '機能');
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
        const store = useBoardStore.getState();
        const blueTag = Object.values(store.tags).find((tag) => tag.name === 'ブルータグ');
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
        const store = useBoardStore.getState();
        const nextTag = Object.values(store.tags).find((tag) => tag.name === '次のタグ');
        expect(nextTag?.color).toBe('#ef4444'); // デフォルトカラー
      });
    });
  });

  describe('タグの表示', () => {
    it('登録済みタグが表示される', () => {
      const store = useBoardStore.getState();
      const tag1: Tag = {
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      };
      const tag2: Tag = {
        id: 'tag-2',
        name: '機能',
        color: '#10b981',
      };

      store.tags = {
        [tag1.id]: tag1,
        [tag2.id]: tag2,
      };
      useBoardStore.setState({ tags: store.tags });

      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('バグ')).toBeInTheDocument();
      expect(screen.getByText('機能')).toBeInTheDocument();
    });

    it('タグがない場合にメッセージが表示される', () => {
      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('タグが登録されていません')).toBeInTheDocument();
    });

    it('タグのカラーが正しく表示される', () => {
      const store = useBoardStore.getState();
      const tag: Tag = {
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      };

      store.tags = { [tag.id]: tag };
      useBoardStore.setState({ tags: store.tags });

      render(<TagManager open={true} onClose={onClose} />);

      const tagItem = screen.getByTestId('tag-item-tag-1');
      expect(tagItem).toHaveStyle({ borderColor: 'rgb(239, 68, 68)' });
    });
  });

  describe('タグの削除', () => {
    it('削除ボタンで確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const tag: Tag = {
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      };

      store.tags = { [tag.id]: tag };
      useBoardStore.setState({ tags: store.tags });

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

      const store = useBoardStore.getState();
      const tag: Tag = {
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      };

      store.tags = { [tag.id]: tag };
      useBoardStore.setState({ tags: store.tags });

      render(<TagManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-tag-tag-1');
      await user.click(deleteButton);

      // 確認ダイアログの削除ボタン
      const confirmButton = await screen.findByRole('button', { name: '削除' });
      await user.click(confirmButton);

      await waitFor(() => {
        const updatedStore = useBoardStore.getState();
        expect(updatedStore.tags['tag-1']).toBeUndefined();
      });
    });

    it('削除キャンセルでタグは削除されない', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const tag: Tag = {
        id: 'tag-1',
        name: 'バグ',
        color: '#ef4444',
      };

      store.tags = { [tag.id]: tag };
      useBoardStore.setState({ tags: store.tags });

      render(<TagManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-tag-tag-1');
      await user.click(deleteButton);

      const cancelButton = await screen.findByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      await waitFor(() => {
        const updatedStore = useBoardStore.getState();
        expect(updatedStore.tags['tag-1']).toBeDefined();
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
      const store = useBoardStore.getState();
      const tags: Record<string, Tag> = {
        'tag-1': { id: 'tag-1', name: 'バグ', color: '#ef4444' },
        'tag-2': { id: 'tag-2', name: '機能', color: '#10b981' },
        'tag-3': { id: 'tag-3', name: '改善', color: '#3b82f6' },
        'tag-4': { id: 'tag-4', name: 'ドキュメント', color: '#8b5cf6' },
      };

      store.tags = tags;
      useBoardStore.setState({ tags: store.tags });

      render(<TagManager open={true} onClose={onClose} />);

      expect(screen.getByText('バグ')).toBeInTheDocument();
      expect(screen.getByText('機能')).toBeInTheDocument();
      expect(screen.getByText('改善')).toBeInTheDocument();
      expect(screen.getByText('ドキュメント')).toBeInTheDocument();

      const store2 = useBoardStore.getState();
      expect(Object.keys(store2.tags).length).toBe(4);
    });
  });
});
