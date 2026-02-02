import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBoardStore } from "@/stores/useBoardStore";
import { Bell, BellOff, Clock, Info } from "lucide-react";
import { sendNotification } from "@tauri-apps/api/notification";
import { toast } from "@/hooks/use-toast";

interface NotificationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const notificationSettings = useBoardStore((state) => state.notificationSettings);
  const updateNotificationSettings = useBoardStore(
    (state) => state.updateNotificationSettings
  );

  // テスト通知を送信
  const handleTestNotification = async () => {
    try {
      await sendNotification({
        title: "テスト通知",
        body: "通知が正しく設定されています",
        icon: "icon.png",
      });
      toast({
        title: "テスト通知を送信しました",
        description: "通知が表示されていることを確認してください",
      });
    } catch (error) {
      console.error("テスト通知の送信に失敗しました:", error);
      toast({
        title: "通知の送信に失敗しました",
        description: "通知権限を確認してください",
        variant: "destructive",
      });
    }
  };

  // デバッグ用：実際の期限通知をテスト
  const handleTestDeadlineNotification = async () => {
    try {
      // 強制的に通知状態をクリア
      localStorage.removeItem("notificationState");

      toast({
        title: "期限通知をテストします",
        description: "次の1分間のチェック時に通知が送信されます",
      });
    } catch (error) {
      console.error("テストの準備に失敗しました:", error);
    }
  };

  // 時刻選択肢（0-23時）
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  // 分選択肢（1分刻み - デバッグ用）
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell size={24} />
            通知設定
          </DialogTitle>
          <DialogDescription>
            タスクの期限に関するデスクトップ通知を設定します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* 通知機能全体のON/OFF */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              {notificationSettings.enabled ? (
                <Bell size={20} className="text-primary" />
              ) : (
                <BellOff size={20} className="text-muted-foreground" />
              )}
              <Label htmlFor="enabled" className="text-base font-semibold cursor-pointer">
                通知を有効にする
              </Label>
            </div>
            <Switch
              id="enabled"
              checked={notificationSettings.enabled}
              onCheckedChange={(enabled) =>
                updateNotificationSettings({ enabled })
              }
            />
          </div>

          {notificationSettings.enabled && (
            <div className="space-y-6">
              {/* 期限通知 */}
              <div className="space-y-4 p-6 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} />
                    <Label
                      htmlFor="deadlineNotifications"
                      className="text-base font-semibold cursor-pointer"
                    >
                      期限通知
                    </Label>
                  </div>
                  <Switch
                    id="deadlineNotifications"
                    checked={notificationSettings.deadlineNotificationsEnabled}
                    onCheckedChange={(deadlineNotificationsEnabled) =>
                      updateNotificationSettings({ deadlineNotificationsEnabled })
                    }
                  />
                </div>

                {notificationSettings.deadlineNotificationsEnabled && (
                  <div className="space-y-4 pt-2">
                    <Label className="text-sm text-muted-foreground">
                      通知時刻
                    </Label>
                    <div className="flex gap-3 items-center">
                      <Select
                        value={String(notificationSettings.deadlineNotificationHour)}
                        onValueChange={(value) =>
                          updateNotificationSettings({
                            deadlineNotificationHour: Number(value),
                          })
                        }
                      >
                        <SelectTrigger className="w-32 h-12 text-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {String(hour).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xl font-semibold">:</span>
                      <Select
                        value={String(notificationSettings.deadlineNotificationMinute)}
                        onValueChange={(value) =>
                          updateNotificationSettings({
                            deadlineNotificationMinute: Number(value),
                          })
                        }
                      >
                        <SelectTrigger className="w-32 h-12 text-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((minute) => (
                            <SelectItem key={minute} value={String(minute)}>
                              {String(minute).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 items-start p-3 rounded-md bg-blue-50 dark:bg-blue-950/20">
                      <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900 dark:text-blue-300">
                        期限1日前/当日/期限超過タスクを通知
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 繰り返しタスク生成の通知 */}
              <div className="space-y-4 p-6 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} />
                    <Label
                      htmlFor="recurringGenerated"
                      className="text-base font-semibold cursor-pointer"
                    >
                      繰り返しタスク生成の通知
                    </Label>
                  </div>
                  <Switch
                    id="recurringGenerated"
                    checked={notificationSettings.recurringGeneratedEnabled}
                    onCheckedChange={(recurringGeneratedEnabled) =>
                      updateNotificationSettings({
                        recurringGeneratedEnabled,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2 items-start p-3 rounded-md bg-blue-50 dark:bg-blue-950/20">
                  <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    繰り返しタスクが生成されたら通知
                  </p>
                </div>
              </div>

              {/* テスト通知ボタン */}
              <div className="pt-2 space-y-3">
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  className="w-full h-12"
                >
                  <Bell size={18} className="mr-2" />
                  通知をテスト
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestDeadlineNotification}
                  className="w-full h-12"
                >
                  <Bell size={18} className="mr-2" />
                  期限通知をテスト（次の1分後）
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
