import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onSearch?: () => void;
  onNewTask?: () => void;
  onEscape?: () => void;
  onShowShortcuts?: () => void;
  onSwitchToKanban?: () => void;
  onSwitchToList?: () => void;
  onOpenMembers?: () => void;
  onOpenTags?: () => void;
  onOpenColumns?: () => void;
  onToggleFilter?: () => void;
  onClearFilters?: () => void;
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

      // Cmd/Ctrl + /: ショートカット一覧表示
      if (modifierKey && e.key === "/") {
        e.preventDefault();
        config.onShowShortcuts?.();
        return;
      }

      // Cmd/Ctrl + 1: カンバンビュー
      if (modifierKey && e.key === "1") {
        e.preventDefault();
        config.onSwitchToKanban?.();
        return;
      }

      // Cmd/Ctrl + 2: リストビュー
      if (modifierKey && e.key === "2") {
        e.preventDefault();
        config.onSwitchToList?.();
        return;
      }

      // Cmd/Ctrl + M: メンバー管理
      if (modifierKey && e.key === "m") {
        e.preventDefault();
        config.onOpenMembers?.();
        return;
      }

      // Cmd/Ctrl + T: タグ管理
      if (modifierKey && e.key === "t") {
        e.preventDefault();
        config.onOpenTags?.();
        return;
      }

      // Cmd/Ctrl + L: 列の管理
      if (modifierKey && e.key === "l") {
        e.preventDefault();
        config.onOpenColumns?.();
        return;
      }

      // Cmd/Ctrl + F: フィルターパネル切り替え
      if (modifierKey && e.key === "f") {
        e.preventDefault();
        config.onToggleFilter?.();
        return;
      }

      // Cmd/Ctrl + Shift + C: フィルタークリア
      if (modifierKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        config.onClearFilters?.();
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
