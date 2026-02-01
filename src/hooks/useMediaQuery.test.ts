import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useViewportSize,
} from './useMediaQuery';

// matchMediaのモック
const createMatchMedia = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  return {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
      listeners.push(listener);
    }),
    removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }),
    addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.push(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    // ヘルパー：リスナーをトリガー
    trigger: (newMatches: boolean) => {
      listeners.forEach((listener) => {
        listener({ matches: newMatches } as MediaQueryListEvent);
      });
    },
  };
};

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof createMatchMedia>;

  beforeEach(() => {
    matchMediaMock = createMatchMedia(false);
    window.matchMedia = vi.fn(() => matchMediaMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本動作', () => {
    it('初期値はmatchMediaの結果を返す（マッチしない）', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);
    });

    it('初期値はmatchMediaの結果を返す（マッチする）', () => {
      matchMediaMock = createMatchMedia(true);
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(true);
    });

    it('matchMediaが正しいクエリで呼ばれる', () => {
      renderHook(() => useMediaQuery('(min-width: 1024px)'));

      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });
  });

  describe('メディアクエリの変更検出', () => {
    it('メディアクエリがマッチするようになると状態が更新される', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);

      // メディアクエリの変更をシミュレート
      act(() => {
        matchMediaMock.trigger(true);
      });

      expect(result.current).toBe(true);
    });

    it('メディアクエリがマッチしなくなると状態が更新される', () => {
      matchMediaMock = createMatchMedia(true);
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(true);

      // メディアクエリの変更をシミュレート
      act(() => {
        matchMediaMock.trigger(false);
      });

      expect(result.current).toBe(false);
    });

    it('複数回の変更を正しく追跡する', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);

      act(() => {
        matchMediaMock.trigger(true);
      });
      expect(result.current).toBe(true);

      act(() => {
        matchMediaMock.trigger(false);
      });
      expect(result.current).toBe(false);

      act(() => {
        matchMediaMock.trigger(true);
      });
      expect(result.current).toBe(true);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にイベントリスナーが削除される（modern API）', () => {
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(matchMediaMock.addEventListener).toHaveBeenCalled();

      unmount();

      expect(matchMediaMock.removeEventListener).toHaveBeenCalled();
    });

    it('アンマウント時にイベントリスナーが削除される（legacy API）', () => {
      // addEventListenerが存在しない古いブラウザをシミュレート
      const legacyMock = createMatchMedia(false);
      delete (legacyMock as any).addEventListener;
      delete (legacyMock as any).removeEventListener;
      window.matchMedia = vi.fn(() => legacyMock as any);

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(legacyMock.addListener).toHaveBeenCalled();

      unmount();

      expect(legacyMock.removeListener).toHaveBeenCalled();
    });
  });

  describe('クエリの変更', () => {
    it('クエリが変更されると新しいリスナーが設定される', () => {
      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      const firstCallCount = (window.matchMedia as any).mock.calls.length;

      rerender({ query: '(min-width: 1024px)' });

      expect((window.matchMedia as any).mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });
});

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof createMatchMedia>;

  beforeEach(() => {
    matchMediaMock = createMatchMedia(false);
    window.matchMedia = vi.fn(() => matchMediaMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('モバイルサイズ（< 768px）でtrueを返す', () => {
    matchMediaMock = createMatchMedia(true);
    window.matchMedia = vi.fn(() => matchMediaMock as any);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('モバイルサイズでない場合falseを返す', () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});

describe('useIsTablet', () => {
  let matchMediaMock: ReturnType<typeof createMatchMedia>;

  beforeEach(() => {
    matchMediaMock = createMatchMedia(false);
    window.matchMedia = vi.fn(() => matchMediaMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('タブレットサイズ（768px - 1279px）でtrueを返す', () => {
    matchMediaMock = createMatchMedia(true);
    window.matchMedia = vi.fn(() => matchMediaMock as any);

    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px) and (max-width: 1279px)');
  });

  it('タブレットサイズでない場合falseを返す', () => {
    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(false);
  });
});

describe('useIsDesktop', () => {
  let matchMediaMock: ReturnType<typeof createMatchMedia>;

  beforeEach(() => {
    matchMediaMock = createMatchMedia(false);
    window.matchMedia = vi.fn(() => matchMediaMock as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('デスクトップサイズ（>= 1280px）でtrueを返す', () => {
    matchMediaMock = createMatchMedia(true);
    window.matchMedia = vi.fn(() => matchMediaMock as any);

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1280px)');
  });

  it('デスクトップサイズでない場合falseを返す', () => {
    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(false);
  });
});

describe('useViewportSize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('デスクトップサイズ（>= 1280px）の場合"desktop"を返す', () => {
    // min-width: 1280px → true, min-width: 768px → true
    let callCount = 0;
    window.matchMedia = vi.fn((query: string) => {
      callCount++;
      const matches = callCount === 1 ? true : true; // 両方true
      return createMatchMedia(matches) as any;
    });

    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toBe('desktop');
  });

  it('タブレットサイズ（768px - 1279px）の場合"tablet"を返す', () => {
    // min-width: 1280px → false, min-width: 768px → true
    let callCount = 0;
    window.matchMedia = vi.fn((query: string) => {
      callCount++;
      const matches = callCount === 1 ? false : true;
      return createMatchMedia(matches) as any;
    });

    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toBe('tablet');
  });

  it('モバイルサイズ（< 768px）の場合"mobile"を返す', () => {
    // min-width: 1280px → false, min-width: 768px → false
    window.matchMedia = vi.fn(() => createMatchMedia(false) as any);

    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toBe('mobile');
  });
});
