import { useEffect, useState } from "react";

/**
 * メディアクエリの状態を監視するカスタムフック
 * @param query - メディアクエリ文字列（例: "(min-width: 768px)"）
 * @returns クエリにマッチするかどうか
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    // 初期値をSSR対応で設定
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    // リスナーを設定
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
};

/**
 * モバイルデバイス判定フック
 * @returns モバイルデバイスかどうか（< 768px）
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery("(max-width: 767px)");
};

/**
 * タブレットデバイス判定フック
 * @returns タブレットデバイスかどうか（768px - 1279px）
 */
export const useIsTablet = (): boolean => {
  return useMediaQuery("(min-width: 768px) and (max-width: 1279px)");
};

/**
 * デスクトップデバイス判定フック
 * @returns デスクトップデバイスかどうか（>= 1280px）
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery("(min-width: 1280px)");
};

export type ViewportSize = "mobile" | "tablet" | "desktop";

/**
 * ビューポートサイズを判定するフック
 * @returns 現在のビューポートサイズ ('mobile' | 'tablet' | 'desktop')
 */
export const useViewportSize = (): ViewportSize => {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isTablet = useMediaQuery("(min-width: 768px)");

  if (isDesktop) return "desktop";
  if (isTablet) return "tablet";
  return "mobile";
};
