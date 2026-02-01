import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipe } from './useSwipe';

// タッチイベントのモックヘルパー
const createTouchEvent = (clientX: number, clientY: number): React.TouchEvent => {
  return {
    touches: [{ clientX, clientY }],
  } as React.TouchEvent;
};

describe('useSwipe', () => {
  describe('基本動作', () => {
    it('タッチイベントハンドラーを返す', () => {
      const { result } = renderHook(() => useSwipe({}));

      expect(result.current.onTouchStart).toBeDefined();
      expect(result.current.onTouchMove).toBeDefined();
      expect(result.current.onTouchEnd).toBeDefined();
      expect(typeof result.current.onTouchStart).toBe('function');
      expect(typeof result.current.onTouchMove).toBe('function');
      expect(typeof result.current.onTouchEnd).toBe('function');
    });
  });

  describe('右スワイプ検出', () => {
    it('閾値以上の右スワイプでonSwipeRightが呼ばれる', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      // タッチ開始（x: 100）
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
      });

      // タッチ移動（x: 160、差分: +60）
      act(() => {
        result.current.onTouchMove(createTouchEvent(160, 200));
      });

      // タッチ終了
      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('閾値未満の右スワイプでは何も呼ばれない', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
      });

      // タッチ移動（x: 130、差分: +30 < 50）
      act(() => {
        result.current.onTouchMove(createTouchEvent(130, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('カスタム閾値が正しく適用される', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 100 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
      });

      // タッチ移動（x: 180、差分: +80 < 100）
      act(() => {
        result.current.onTouchMove(createTouchEvent(180, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).not.toHaveBeenCalled();

      // タッチ移動（x: 210、差分: +110 >= 100）
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
        result.current.onTouchMove(createTouchEvent(210, 200));
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('左スワイプ検出', () => {
    it('閾値以上の左スワイプでonSwipeLeftが呼ばれる', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, threshold: 50 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 200));
      });

      // タッチ移動（x: 140、差分: -60）
      act(() => {
        result.current.onTouchMove(createTouchEvent(140, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('閾値未満の左スワイプでは何も呼ばれない', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, threshold: 50 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 200));
      });

      // タッチ移動（x: 170、差分: -30 < 50）
      act(() => {
        result.current.onTouchMove(createTouchEvent(170, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('垂直スワイプの除外', () => {
    it('垂直方向の移動が多い場合はスワイプとして検出されない', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100));
      });

      // 垂直方向の移動が大きい（y: +100、x: +60）
      act(() => {
        result.current.onTouchMove(createTouchEvent(160, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('水平方向の移動が多い場合はスワイプとして検出される', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100));
      });

      // 水平方向の移動が大きい（x: +100、y: +30）
      act(() => {
        result.current.onTouchMove(createTouchEvent(200, 130));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('エッジケース', () => {
    it('タッチ移動なしで終了した場合は何も呼ばれない', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
      });

      // 移動なしで終了
      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('タッチ開始なしで移動した場合は何も起こらない', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight }));

      // 開始なしで移動
      act(() => {
        result.current.onTouchMove(createTouchEvent(200, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('コールバックが未定義の場合でもエラーにならない', () => {
      const { result } = renderHook(() => useSwipe({}));

      expect(() => {
        act(() => {
          result.current.onTouchStart(createTouchEvent(100, 200));
          result.current.onTouchMove(createTouchEvent(200, 200));
          result.current.onTouchEnd();
        });
      }).not.toThrow();
    });

    it('デフォルト閾値（50）が使用される', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
      });

      // 差分: +49（閾値未満）
      act(() => {
        result.current.onTouchMove(createTouchEvent(149, 200));
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).not.toHaveBeenCalled();

      // 差分: +50（閾値以上）
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
        result.current.onTouchMove(createTouchEvent(150, 200));
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('連続スワイプ', () => {
    it('複数回のスワイプを正しく検出する', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      // 1回目
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
        result.current.onTouchMove(createTouchEvent(160, 200));
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);

      // 2回目
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
        result.current.onTouchMove(createTouchEvent(160, 200));
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(2);
    });

    it('左右のスワイプを交互に検出する', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight, threshold: 50 }));

      // 右スワイプ
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
        result.current.onTouchMove(createTouchEvent(160, 200));
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();

      // 左スワイプ
      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 200));
        result.current.onTouchMove(createTouchEvent(140, 200));
        result.current.onTouchEnd();
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('状態のリセット', () => {
    it('タッチ終了後に状態がリセットされる', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 200));
        result.current.onTouchMove(createTouchEvent(160, 200));
        result.current.onTouchEnd();
      });

      // 状態がリセットされているので、移動なしの終了では何も起こらない
      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1); // 最初の1回のみ
    });
  });
});
