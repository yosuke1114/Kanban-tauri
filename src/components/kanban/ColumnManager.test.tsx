import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColumnManager from './ColumnManager';
import { useBoardStore } from '@/stores/useBoardStore';
import { resetStore, createMockTask, addTaskToStore } from '@/test-utils/mockStore';

describe('ColumnManager', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetStore();
    onClose = vi.fn();
  });

  describe('列の表示', () => {
    it('ダイアログが開いている時に現在の列が表示される', () => {
      render(<ColumnManager open={true} onClose={onClose} />);

      expect(screen.getByText('未着手')).toBeInTheDocument();
      expect(screen.getByText('進行中')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('ダイアログが閉じている時は何も表示されない', () => {
      const { container } = render(<ColumnManager open={false} onClose={onClose} />);

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('列の色が正しく表示される', () => {
      render(<ColumnManager open={true} onClose={onClose} />);

      // 各列のカラードットを確認
      expect(screen.getByTestId('column-color-todo')).toBeInTheDocument();
      expect(screen.getByTestId('column-color-inProgress')).toBeInTheDocument();
      expect(screen.getByTestId('column-color-done')).toBeInTheDocument();
    });
  });

  describe('列の追加', () => {
    it('新しい列を追加できる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('column-name-input');
      const addButton = screen.getByTestId('add-column-button');

      await user.type(input, 'レビュー中');
      await user.click(addButton);

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        const reviewColumn = Object.values(board?.columns || {}).find(
          (col) => col.title === 'レビュー中'
        );
        expect(reviewColumn).toBeDefined();
        expect(reviewColumn?.isDefault).toBe(false);
      });
    });

    it('Enterキーで列を追加できる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const input = screen.getByPlaceholderText('列名を入力');

      await user.type(input, 'テスト列{Enter}');

      await waitFor(() => {
        const state = useBoardStore.getState();
        const board = state.boards[state.currentBoardId];
        const testColumn = Object.values(board?.columns || {}).find(
          (col) => col.title === 'テスト列'
        );
        expect(testColumn).toBeDefined();
      });
    });

    it('空の列名では追加できない', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const addButton = screen.getByTestId('add-column-button');
      const initialColumnCount = useBoardStore.getState().columnOrder.length;

      await user.click(addButton);

      const finalColumnCount = useBoardStore.getState().columnOrder.length;
      expect(finalColumnCount).toBe(initialColumnCount);
    });

    it('列追加後に入力欄がクリアされる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('column-name-input') as HTMLInputElement;
      const addButton = screen.getByTestId('add-column-button');

      await user.type(input, '新しい列');
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('列の削除', () => {
    it('タスクがない列は削除できる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      // 削除ボタンをクリック（todoの削除ボタン）
      const deleteButton = screen.getByTestId('delete-column-todo');

      await user.click(deleteButton);

      // 確認ダイアログが表示される
      await waitFor(() => {
        expect(screen.getByText('列を削除しますか？')).toBeInTheDocument();
      });

      // 削除を確認
      const confirmButton = screen.getByRole('button', { name: '削除' });
      await user.click(confirmButton);

      await waitFor(() => {
        const store = useBoardStore.getState();
        const board = store.boards[store.currentBoardId];
        expect(board?.columnOrder).toHaveLength(2);
      });
    });

    it('タスクがある列は削除できない', async () => {
      const user = userEvent.setup();

      // タスクを追加
      const task = createMockTask({ columnId: 'todo' });
      addTaskToStore(task);

      render(<ColumnManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-column-todo');

      await user.click(deleteButton);

      // エラーダイアログが表示される
      await waitFor(() => {
        expect(screen.getByText('列を削除できません')).toBeInTheDocument();
        expect(
          screen.getByText(/この列には1個のタスクがあります/)
        ).toBeInTheDocument();
      });

      // OKボタンでエラーダイアログを閉じる
      const okButton = screen.getByRole('button', { name: 'OK' });
      await user.click(okButton);

      // 列は削除されていない
      const finalStore = useBoardStore.getState();
      const board = finalStore.boards[finalStore.currentBoardId];
      expect(board?.columnOrder).toHaveLength(3);
    });

    it('最後の列は削除できない', async () => {
      const user = userEvent.setup();

      // 2つの列を削除して1つだけ残す
      const store = useBoardStore.getState();
      const board = store.boards[store.currentBoardId];
      if (board) {
        useBoardStore.setState({
          boards: {
            ...store.boards,
            [store.currentBoardId]: {
              ...board,
              columnOrder: ['todo'],
              columns: { todo: board.columns.todo },
            },
          },
        });
      }

      render(<ColumnManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-column-todo');

      await user.click(deleteButton);

      // エラーダイアログが表示される
      await waitFor(() => {
        expect(screen.getByText('列を削除できません')).toBeInTheDocument();
        expect(
          screen.getByText(/最後の列は削除できません/)
        ).toBeInTheDocument();
      });
    });

    it('削除確認ダイアログでキャンセルできる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-column-todo');

      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('列を削除しますか？')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      // 列は削除されていない
      const store = useBoardStore.getState();
      const board = store.boards[store.currentBoardId];
      expect(board?.columnOrder).toHaveLength(3);
    });
  });

  describe('カラー選択', () => {
    it('8つのカラーオプションが表示される', () => {
      render(<ColumnManager open={true} onClose={onClose} />);

      // 8つのカラーオプションを確認
      expect(screen.getByTestId('color-option-グレー')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-ブルー')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-グリーン')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-イエロー')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-オレンジ')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-レッド')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-パープル')).toBeInTheDocument();
      expect(screen.getByTestId('color-option-ピンク')).toBeInTheDocument();
    });

    it('カラーを選択できる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const blueButton = screen.getByTestId('color-option-ブルー');

      await user.click(blueButton);

      // 選択されたカラーのボタンが強調表示される
      await waitFor(() => {
        expect(blueButton.className).toContain('border-primary');
      });
    });

    it('選択したカラーで列を追加できる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      // カラーを選択
      const greenButton = screen.getByTestId('color-option-グリーン');
      await user.click(greenButton);

      // 列名を入力して追加
      const input = screen.getByTestId('column-name-input');
      const addButton = screen.getByTestId('add-column-button');

      await user.type(input, 'グリーン列');
      await user.click(addButton);

      await waitFor(() => {
        const store = useBoardStore.getState();
        const board = store.boards[store.currentBoardId];
        const greenColumn = Object.values(board?.columns || {}).find(
          (col) => col.title === 'グリーン列'
        );
        expect(greenColumn?.color).toBe('#34d399');
      });
    });
  });

  describe('ダイアログの開閉', () => {
    it('閉じるボタンでダイアログを閉じる', async () => {
      const user = userEvent.setup();
      render(<ColumnManager open={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '閉じる' });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ダイアログ外クリックで閉じる', async () => {
      const user = userEvent.setup();
      const { container } = render(<ColumnManager open={true} onClose={onClose} />);

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

  describe('列の並べ替え（ドラッグ&ドロップ）', () => {
    it('列の順序が正しく表示される', () => {
      render(<ColumnManager open={true} onClose={onClose} />);

      const columnNames = screen.getAllByText(/^(未着手|進行中|完了)$/);
      expect(columnNames).toHaveLength(3);
      expect(columnNames[0]).toHaveTextContent('未着手');
      expect(columnNames[1]).toHaveTextContent('進行中');
      expect(columnNames[2]).toHaveTextContent('完了');
    });

    it('GripVerticalアイコンが各列に表示される', () => {
      render(<ColumnManager open={true} onClose={onClose} />);

      // 各列のドラッグハンドルを確認
      expect(screen.getByTestId('column-drag-handle-todo')).toBeInTheDocument();
      expect(screen.getByTestId('column-drag-handle-inProgress')).toBeInTheDocument();
      expect(screen.getByTestId('column-drag-handle-done')).toBeInTheDocument();
    });
  });

  describe('複数の列がある場合', () => {
    it('4つ以上の列も正しく表示される', () => {
      const store = useBoardStore.getState();
      const board = store.boards[store.currentBoardId];

      if (board) {
        const updatedBoard = {
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
            testing: {
              id: 'testing',
              title: 'テスト中',
              color: '#ec4899',
              position: 4,
              isDefault: false,
            },
          },
          columnOrder: ['todo', 'inProgress', 'review', 'testing', 'done'],
        };

        useBoardStore.setState({
          boards: {
            ...store.boards,
            [store.currentBoardId]: updatedBoard,
          },
        });
      }

      render(<ColumnManager open={true} onClose={onClose} />);

      expect(screen.getByText('レビュー中')).toBeInTheDocument();
      expect(screen.getByText('テスト中')).toBeInTheDocument();

      const store2 = useBoardStore.getState();
      const board2 = store2.boards[store2.currentBoardId];
      expect(board2?.columnOrder).toHaveLength(5);
    });
  });
});
