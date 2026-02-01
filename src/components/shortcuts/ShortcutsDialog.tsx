import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";

const shortcuts = [
  {
    category: "基本操作",
    items: [
      { keys: [`${modKey}`, "K"], description: "検索フォーカス" },
      { keys: [`${modKey}`, "N"], description: "新規タスク作成" },
      { keys: ["Esc"], description: "ダイアログを閉じる" },
      { keys: [`${modKey}`, "/"], description: "ショートカット一覧表示" },
    ],
  },
  {
    category: "ビュー切り替え",
    items: [
      { keys: [`${modKey}`, "1"], description: "カンバンビュー" },
      { keys: [`${modKey}`, "2"], description: "リストビュー" },
    ],
  },
  {
    category: "管理画面",
    items: [
      { keys: [`${modKey}`, "M"], description: "メンバー管理を開く" },
      { keys: [`${modKey}`, "T"], description: "タグ管理を開く" },
      { keys: [`${modKey}`, "L"], description: "列の管理を開く" },
    ],
  },
  {
    category: "フィルター",
    items: [
      { keys: [`${modKey}`, "F"], description: "フィルターパネルを切り替え" },
      { keys: [`${modKey}`, "Shift", "C"], description: "フィルターをクリア" },
    ],
  },
];

const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm">
    {keyName}
  </kbd>
);

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-lg border-border/50 shadow-apple-xl glass">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard size={24} className="text-primary" />
            <DialogTitle className="text-xl font-semibold tracking-tight">
              キーボードショートカット
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            キーボードショートカットで効率的に操作できます
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-apple"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <KeyBadge keyName={key} />
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-1">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          ヒント: {modKey} + / でこの画面をいつでも表示できます
        </div>
      </DialogContent>
    </Dialog>
  );
};
