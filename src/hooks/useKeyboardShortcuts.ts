import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onSearch?: () => void;
  onNewTask?: () => void;
  onEscape?: () => void;
}

/**
 * Apple風キーボードショートカットフック
 * macOS: Cmd+K (検索), Cmd+N (新規タスク), Escape (閉じる)
 * Windows/Linux: Ctrl+K, Ctrl+N, Escape
 */
export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: 検索フォーカス
      if (modifierKey && e.key === "k") {
        e.preventDefault();
        config.onSearch?.();
        return;
      }

      // Cmd/Ctrl + N: 新規タスク
      if (modifierKey && e.key === "n") {
        e.preventDefault();
        config.onNewTask?.();
        return;
      }

      // Escape: モーダル/ダイアログを閉じる
      if (e.key === "Escape") {
        config.onEscape?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
};
