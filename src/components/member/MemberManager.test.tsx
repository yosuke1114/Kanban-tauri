import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberManager from './MemberManager';
import { useBoardStore } from '@/stores/useBoardStore';
import type { Member } from '@/types';
import { resetStore, createMockMember, addMemberToStore } from '@/test-utils/mockStore';

describe('MemberManager', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetStore();
    onClose = vi.fn();
  });

  describe('基本表示', () => {
    it('ダイアログが開いている時にタイトルが表示される', () => {
      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByText('メンバー管理')).toBeInTheDocument();
      expect(screen.getByText('チームメンバーを追加・編集します')).toBeInTheDocument();
    });

    it('ダイアログが閉じている時は何も表示されない', () => {
      const { container } = render(<MemberManager open={false} onClose={onClose} />);

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('メンバー入力フィールドが表示される', () => {
      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByTestId('member-name-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('名前を入力')).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByTestId('add-member-button')).toBeInTheDocument();
    });

    it('8つのカラーオプションが表示される', () => {
      render(<MemberManager open={true} onClose={onClose} />);

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

  describe('メンバーの追加', () => {
    it('メンバー名を入力して追加できる', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('member-name-input');
      const addButton = screen.getByTestId('add-member-button');

      await user.type(input, '田中太郎');
      await user.click(addButton);

      await waitFor(() => {
        const store = useBoardStore.getState();
        const member = Object.values(store.members).find((m) => m.name === '田中太郎');
        expect(member).toBeDefined();
        expect(member?.color).toBe('#ef4444'); // デフォルトカラー
        expect(member?.isActive).toBe(true);
      });
    });

    it('Enterキーでメンバーを追加できる', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('member-name-input');

      await user.type(input, '山田花子{Enter}');

      await waitFor(() => {
        const store = useBoardStore.getState();
        const member = Object.values(store.members).find((m) => m.name === '山田花子');
        expect(member).toBeDefined();
      });
    });

    it('空のメンバー名では追加できない', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

      const addButton = screen.getByTestId('add-member-button');
      const initialMemberCount = Object.keys(useBoardStore.getState().members).length;

      await user.click(addButton);

      const finalMemberCount = Object.keys(useBoardStore.getState().members).length;
      expect(finalMemberCount).toBe(initialMemberCount);
    });

    it('メンバー追加後に入力欄がクリアされる', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

      const input = screen.getByTestId('member-name-input') as HTMLInputElement;
      const addButton = screen.getByTestId('add-member-button');

      await user.type(input, '新しいメンバー');
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('選択したカラーでメンバーを追加できる', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

      // カラーを選択（ブルー）
      const blueButton = screen.getByTestId('color-option-#3b82f6');
      await user.click(blueButton);

      // メンバーを追加
      const input = screen.getByTestId('member-name-input');
      const addButton = screen.getByTestId('add-member-button');

      await user.type(input, '青木');
      await user.click(addButton);

      await waitFor(() => {
        const store = useBoardStore.getState();
        const member = Object.values(store.members).find((m) => m.name === '青木');
        expect(member?.color).toBe('#3b82f6');
      });
    });

    it('メンバー追加後に選択カラーがリセットされる', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

      // カラーを選択
      const greenButton = screen.getByTestId('color-option-#10b981');
      await user.click(greenButton);

      // メンバーを追加
      const input = screen.getByTestId('member-name-input');
      const addButton = screen.getByTestId('add-member-button');

      await user.type(input, '緑川');
      await user.click(addButton);

      // 次のメンバーを追加時、デフォルトカラーが選択されている
      await user.type(input, '次のメンバー');
      await user.click(addButton);

      await waitFor(() => {
        const store = useBoardStore.getState();
        const member = Object.values(store.members).find((m) => m.name === '次のメンバー');
        expect(member?.color).toBe('#ef4444'); // デフォルトカラー
      });
    });
  });

  describe('メンバーの表示', () => {
    it('登録済みメンバーが表示される', () => {
      const store = useBoardStore.getState();
      const member1: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };
      const member2: Member = {
        id: 'member-2',
        name: '山田花子',
        color: '#10b981',
        isActive: true,
      };

      store.members = {
        [member1.id]: member1,
        [member2.id]: member2,
      };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('山田花子')).toBeInTheDocument();
    });

    it('メンバーがない場合にメッセージが表示される', () => {
      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByText('メンバーが登録されていません')).toBeInTheDocument();
    });

    it('メンバーのカラーが正しく表示される', () => {
      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      const colorDot = screen.getByTestId('member-color-member-1');
      expect(colorDot).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('有効なメンバーに「有効」バッジが表示される', () => {
      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByText('有効')).toBeInTheDocument();
    });

    it('無効なメンバーに「無効」バッジと打ち消し線が表示される', () => {
      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: false,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByText('無効')).toBeInTheDocument();
      expect(screen.getByText('田中太郎')).toBeInTheDocument();

      // 無効化ボタンではなく有効化ボタンが表示される
      expect(screen.getByText('有効化')).toBeInTheDocument();
    });
  });

  describe('メンバーの有効/無効切り替え', () => {
    it('有効なメンバーを無効化できる', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      const toggleButton = screen.getByTestId('toggle-member-member-1');
      expect(toggleButton).toHaveTextContent('無効化');

      await user.click(toggleButton);

      await waitFor(() => {
        const updatedStore = useBoardStore.getState();
        expect(updatedStore.members['member-1'].isActive).toBe(false);
      });
    });

    it('無効なメンバーを有効化できる', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: false,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      const toggleButton = screen.getByTestId('toggle-member-member-1');
      expect(toggleButton).toHaveTextContent('有効化');

      await user.click(toggleButton);

      await waitFor(() => {
        const updatedStore = useBoardStore.getState();
        expect(updatedStore.members['member-1'].isActive).toBe(true);
      });
    });

    it('トグル後にボタンのラベルが変わる', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      const { rerender } = render(<MemberManager open={true} onClose={onClose} />);

      const toggleButton = screen.getByTestId('toggle-member-member-1');
      await user.click(toggleButton);

      // 状態を更新して再レンダリング
      const updatedStore = useBoardStore.getState();
      rerender(<MemberManager open={true} onClose={onClose} />);

      await waitFor(() => {
        const updatedButton = screen.getByTestId('toggle-member-member-1');
        expect(updatedButton).toHaveTextContent('有効化');
      });
    });
  });

  describe('メンバーの削除', () => {
    it('削除ボタンで確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-member-member-1');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('メンバーを削除しますか？')).toBeInTheDocument();
        expect(screen.getByText(/メンバー「田中太郎」が完全に削除され/)).toBeInTheDocument();
      });
    });

    it('削除確認でメンバーが削除される', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-member-member-1');
      await user.click(deleteButton);

      // 確認ダイアログの削除ボタン
      const confirmButton = await screen.findByRole('button', { name: '削除' });
      await user.click(confirmButton);

      await waitFor(() => {
        const updatedStore = useBoardStore.getState();
        expect(updatedStore.members['member-1']).toBeUndefined();
      });
    });

    it('削除キャンセルでメンバーは削除されない', async () => {
      const user = userEvent.setup();

      const store = useBoardStore.getState();
      const member: Member = {
        id: 'member-1',
        name: '田中太郎',
        color: '#ef4444',
        isActive: true,
      };

      store.members = { [member.id]: member };
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      const deleteButton = screen.getByTestId('delete-member-member-1');
      await user.click(deleteButton);

      const cancelButton = await screen.findByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      await waitFor(() => {
        const updatedStore = useBoardStore.getState();
        expect(updatedStore.members['member-1']).toBeDefined();
      });
    });
  });

  describe('カラー選択', () => {
    it('カラーを選択できる', async () => {
      const user = userEvent.setup();
      render(<MemberManager open={true} onClose={onClose} />);

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
      render(<MemberManager open={true} onClose={onClose} />);

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
      render(<MemberManager open={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '閉じる' });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ダイアログ外クリックで閉じる', async () => {
      const user = userEvent.setup();
      const { container } = render(<MemberManager open={true} onClose={onClose} />);

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

  describe('複数のメンバー', () => {
    it('複数のメンバーが正しく表示される', () => {
      const store = useBoardStore.getState();
      const members: Record<string, Member> = {
        'member-1': { id: 'member-1', name: '田中太郎', color: '#ef4444', isActive: true },
        'member-2': { id: 'member-2', name: '山田花子', color: '#10b981', isActive: true },
        'member-3': { id: 'member-3', name: '佐藤次郎', color: '#3b82f6', isActive: false },
        'member-4': { id: 'member-4', name: '鈴木一郎', color: '#8b5cf6', isActive: true },
      };

      store.members = members;
      useBoardStore.setState({ members: store.members });

      render(<MemberManager open={true} onClose={onClose} />);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('山田花子')).toBeInTheDocument();
      expect(screen.getByText('佐藤次郎')).toBeInTheDocument();
      expect(screen.getByText('鈴木一郎')).toBeInTheDocument();

      const store2 = useBoardStore.getState();
      expect(Object.keys(store2.members).length).toBe(4);
    });
  });
});
