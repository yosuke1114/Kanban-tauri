import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  describe('基本表示', () => {
    it('検索入力フィールドが表示される', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      expect(input).toBeInTheDocument();
    });

    it('デフォルトのプレースホルダーが表示される', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      expect(screen.getByPlaceholderText('タスクを検索...')).toBeInTheDocument();
    });

    it('カスタムプレースホルダーが表示される', () => {
      const onChange = vi.fn();
      render(
        <SearchBar value="" onChange={onChange} placeholder="カスタム検索" />
      );

      expect(screen.getByPlaceholderText('カスタム検索')).toBeInTheDocument();
    });

    it('検索アイコンが表示される', () => {
      const onChange = vi.fn();
      const { container } = render(<SearchBar value="" onChange={onChange} />);

      const searchIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('値の表示', () => {
    it('propsで渡された値が表示される', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test query" onChange={onChange} />);

      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      expect(input).toHaveValue('test query');
    });

    it('空の値が表示される', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      expect(input).toHaveValue('');
    });
  });

  describe('入力操作', () => {
    it('テキスト入力でonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      await user.type(input, 'a');

      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('複数文字の入力で各文字ごとにonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      await user.type(input, 'test');

      expect(onChange).toHaveBeenCalledTimes(4);
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('クリアボタン', () => {
    it('値が空の時はクリアボタンが表示されない', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      const clearButton = screen.queryByRole('button', { name: '検索をクリア' });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('値がある時はクリアボタンが表示される', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: '検索をクリア' });
      expect(clearButton).toBeInTheDocument();
    });

    it('クリアボタンをクリックで空文字列が渡される', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar value="test query" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: '検索をクリア' });
      await user.click(clearButton);

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('クリアボタンクリック後、再度入力できる', async () => {
      const user = userEvent.setup();
      let value = 'initial';
      const onChange = vi.fn((newValue: string) => {
        value = newValue;
      });

      const { rerender } = render(<SearchBar value={value} onChange={onChange} />);

      // クリア
      const clearButton = screen.getByRole('button', { name: '検索をクリア' });
      await user.click(clearButton);

      // クリアが呼ばれたことを確認
      expect(onChange).toHaveBeenCalledWith('');

      // 再レンダリング
      rerender(<SearchBar value="" onChange={onChange} />);

      // 再入力
      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      await user.type(input, 'new');

      // 入力後にonChangeが呼ばれたことを確認
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('ref転送', () => {
    it('refが正しく転送される', () => {
      const onChange = vi.fn();
      const ref = { current: null as HTMLInputElement | null };

      render(<SearchBar value="" onChange={onChange} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('text');
    });

    it('ref経由でフォーカスできる', () => {
      const onChange = vi.fn();
      const ref = { current: null as HTMLInputElement | null };

      render(<SearchBar value="" onChange={onChange} ref={ref} />);

      ref.current?.focus();

      expect(ref.current).toBe(document.activeElement);
    });
  });

  describe('スタイルとクラス', () => {
    it('カスタムクラスが適用される', () => {
      const onChange = vi.fn();
      const { container } = render(
        <SearchBar value="" onChange={onChange} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('デフォルトクラスが適用される', () => {
      const onChange = vi.fn();
      const { container } = render(<SearchBar value="" onChange={onChange} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('relative');
      expect(wrapper.className).toContain('w-full');
    });
  });

  describe('アクセシビリティ', () => {
    it('検索入力にaria-labelが設定されている', () => {
      const onChange = vi.fn();
      render(<SearchBar value="" onChange={onChange} />);

      const input = screen.getByRole('textbox', { name: 'タスク検索' });
      expect(input).toHaveAttribute('aria-label', 'タスク検索');
    });

    it('検索アイコンにaria-hidden="true"が設定されている', () => {
      const onChange = vi.fn();
      const { container } = render(<SearchBar value="" onChange={onChange} />);

      const searchIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('クリアボタンにaria-labelが設定されている', () => {
      const onChange = vi.fn();
      render(<SearchBar value="test" onChange={onChange} />);

      const clearButton = screen.getByRole('button', { name: '検索をクリア' });
      expect(clearButton).toHaveAttribute('aria-label', '検索をクリア');
    });
  });
});
