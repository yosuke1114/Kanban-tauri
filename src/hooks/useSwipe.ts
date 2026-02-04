import React, { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

/**
 * スワイプジェスチャーを検出するカスタムフック
 * @param options - スワイプ時のコールバックと閾値
 * @returns タッチイベントハンドラー
 */
export const useSwipe = (options: UseSwipeOptions): SwipeHandlers => {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoveX = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMoveX.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    // 垂直方向のスワイプが多い場合はスクロールとして扱う
    const deltaX = Math.abs(currentX - touchStartX.current);
    const deltaY = Math.abs(currentY - touchStartY.current);

    if (deltaY > deltaX) {
      // 垂直方向のスワイプ、何もしない（通常のスクロール）
      return;
    }

    touchMoveX.current = currentX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchMoveX.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      touchMoveX.current = null;
      return;
    }

    const diff = touchMoveX.current - touchStartX.current;

    if (Math.abs(diff) >= threshold) {
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchMoveX.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};
