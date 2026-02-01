import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { FolderOpen, Download, Upload, Info } from "lucide-react";
import {
  StorageType,
  storageManager,
  StorageConfig,
} from "@/services/storage/storageManager";
import { useToast } from "@/hooks/use-toast";

interface DataStorageSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const DataStorageSettings: React.FC<DataStorageSettingsProps> = ({
  open,
  onClose,
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<StorageConfig>(
    storageManager.getConfig()
  );
  const [dataPath, setDataPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    const currentConfig = storageManager.getConfig();
    setConfig(currentConfig);
    const path = await storageManager.getDataPath();
    setDataPath(path);
  };

  const handleStorageTypeChange = async (value: StorageType) => {
    if (value === "sharepoint") {
      toast({
        title: "準備中",
        description: "SharePoint連携は現在準備中です",
        variant: "default",
      });
      return;
    }

    if (value === "tauriFile") {
      // Tauriファイルを選択した場合、保存先を選択
      const isTauri =
        typeof window !== "undefined" && "__TAURI__" in window;
      if (!isTauri) {
        toast({
          title: "エラー",
          description:
            "ローカルファイル保存はデスクトップアプリでのみ利用可能です",
          variant: "destructive",
        });
        return;
      }
    }

    setConfig({ ...config, type: value });
  };

  const handleSelectDirectory = async () => {
    // Tauri環境チェック
    const isTauri = typeof window !== "undefined" && "__TAURI__" in window;
    if (!isTauri) {
      toast({
        title: "エラー",
        description:
          "ディレクトリ選択はデスクトップアプリでのみ利用可能です",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedPath = await storageManager.selectTauriFilePath();
      if (selectedPath) {
        setConfig({
          ...config,
          type: "tauriFile",
          tauriFilePath: selectedPath,
        });
        toast({
          title: "保存先を選択しました",
          description: `保存先: ${selectedPath}`,
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存先の選択に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await storageManager.setStorageType(
        config.type,
        config.tauriFilePath
      );

      toast({
        title: "設定を保存しました",
        description: `保存先: ${config.type === "localStorage" ? "ブラウザストレージ" : config.type === "tauriFile" ? "ローカルファイル" : "SharePoint"}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await storageManager.exportBackup();

      // データをダウンロード
      const fileName = `kanban-backup-${new Date().toISOString().split("T")[0]}.json`;
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ エクスポート完了",
        description: `ファイル: ${fileName}\nダウンロードフォルダに保存されました`,
      });
    } catch (error) {
      toast({
        title: "エラー",
        description:
          error instanceof Error ? error.message : "エクスポートに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);
        const text = await file.text();
        await storageManager.importBackup(text);

        toast({
          title: "✅ インポート完了",
          description: `ファイル: ${file.name}\n2秒後にページを再読み込みします...`,
        });

        // ページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        toast({
          title: "❌ インポート失敗",
          description:
            error instanceof Error ? error.message : "インポートに失敗しました",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-lg border-border/50 shadow-apple-xl glass p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            データ保存設定
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            データの保存先を選択し、バックアップを管理します
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* 現在の保存先 */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">現在の保存先</p>
                <p className="text-xs text-muted-foreground mt-1">{dataPath}</p>
              </div>
            </div>
          </div>

          {/* ストレージタイプ選択 */}
          <div className="space-y-2">
            <Label>ストレージタイプ</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(value) =>
                handleStorageTypeChange(value as StorageType)
              }
            >
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="localStorage" id="localStorage" />
                <Label
                  htmlFor="localStorage"
                  className="flex-1 cursor-pointer"
                >
                  <div>
                    <p className="font-medium">ブラウザストレージ</p>
                    <p className="text-xs text-muted-foreground">
                      ブラウザのlocalStorageに保存（Web版で推奨）
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="tauriFile" id="tauriFile" />
                <Label htmlFor="tauriFile" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">ローカルファイル</p>
                    <p className="text-xs text-muted-foreground">
                      PCのファイルシステムに保存（デスクトップアプリで推奨）
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors opacity-60">
                <RadioGroupItem
                  value="sharepoint"
                  id="sharepoint"
                  disabled
                />
                <Label htmlFor="sharepoint" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">SharePoint（準備中）</p>
                    <p className="text-xs text-muted-foreground">
                      SharePointに保存してチームで共有
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tauriファイルの保存先選択 */}
          {config.type === "tauriFile" && (
            <div className="space-y-2">
              <Label>保存先ディレクトリ</Label>
              <div className="flex gap-2">
                <Input
                  value={config.tauriFilePath || "デフォルト"}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSelectDirectory}
                  disabled={isLoading}
                  title="ディレクトリを選択"
                >
                  <FolderOpen size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ※ ディレクトリ選択はデスクトップアプリでのみ利用可能です
              </p>
            </div>
          )}

          {/* バックアップ操作 */}
          <div className="border-t pt-4 space-y-2">
            <Label>バックアップ</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isLoading}
                className="w-full"
              >
                <Download size={16} className="mr-2" />
                エクスポート
              </Button>
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={isLoading}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                インポート
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              データをJSON形式でエクスポート・インポートできます
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/20">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md transition-apple"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-md transition-apple"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
