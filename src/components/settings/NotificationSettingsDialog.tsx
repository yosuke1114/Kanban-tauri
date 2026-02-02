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
import { Bell, BellOff, Clock } from "lucide-react";
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

  // 時刻選択肢（0-23時）
  const timeOptions = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell size={20} />
            通知設定
          </DialogTitle>
          <DialogDescription>
            タスクの期限に関するデスクトップ通知を設定します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 通知機能全体のON/OFF */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notificationSettings.enabled ? (
                <Bell size={18} className="text-primary" />
              ) : (
                <BellOff size={18} className="text-muted-foreground" />
              )}
              <Label htmlFor="enabled" className="text-base font-semibold">
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
            <>
              <div className="border-t pt-4 space-y-4">
                {/* 期限24時間前の通知 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="due24Hours"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Clock size={16} />
                      期限24時間前の通知
                    </Label>
                    <Switch
                      id="due24Hours"
                      checked={notificationSettings.due24HoursEnabled}
                      onCheckedChange={(due24HoursEnabled) =>
                        updateNotificationSettings({ due24HoursEnabled })
                      }
                    />
                  </div>
                  {notificationSettings.due24HoursEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label
                        htmlFor="due24HoursTime"
                        className="text-xs text-muted-foreground"
                      >
                        通知時刻
                      </Label>
                      <Select
                        value={String(notificationSettings.due24HoursTime)}
                        onValueChange={(value) =>
                          updateNotificationSettings({
                            due24HoursTime: Number(value),
                          })
                        }
                      >
                        <SelectTrigger id="due24HoursTime" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ 期限の24時間前に通知します
                      </p>
                    </div>
                  )}
                </div>

                {/* 期限当日の通知 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="dueToday"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Clock size={16} />
                      期限当日の通知
                    </Label>
                    <Switch
                      id="dueToday"
                      checked={notificationSettings.dueTodayEnabled}
                      onCheckedChange={(dueTodayEnabled) =>
                        updateNotificationSettings({ dueTodayEnabled })
                      }
                    />
                  </div>
                  {notificationSettings.dueTodayEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label
                        htmlFor="dueTodayTime"
                        className="text-xs text-muted-foreground"
                      >
                        通知時刻
                      </Label>
                      <Select
                        value={String(notificationSettings.dueTodayTime)}
                        onValueChange={(value) =>
                          updateNotificationSettings({
                            dueTodayTime: Number(value),
                          })
                        }
                      >
                        <SelectTrigger id="dueTodayTime" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ 期限当日の朝に通知します
                      </p>
                    </div>
                  )}
                </div>

                {/* 期限超過の通知 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="overdue"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Clock size={16} />
                      期限超過の通知
                    </Label>
                    <Switch
                      id="overdue"
                      checked={notificationSettings.overdueEnabled}
                      onCheckedChange={(overdueEnabled) =>
                        updateNotificationSettings({ overdueEnabled })
                      }
                    />
                  </div>
                  {notificationSettings.overdueEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label
                        htmlFor="overdueTime"
                        className="text-xs text-muted-foreground"
                      >
                        通知時刻
                      </Label>
                      <Select
                        value={String(notificationSettings.overdueTime)}
                        onValueChange={(value) =>
                          updateNotificationSettings({
                            overdueTime: Number(value),
                          })
                        }
                      >
                        <SelectTrigger id="overdueTime" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ 期限を過ぎたタスクを毎日通知します
                      </p>
                    </div>
                  )}
                </div>

                {/* 繰り返しタスク生成の通知 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="recurringGenerated"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Clock size={16} />
                      繰り返しタスク生成の通知
                    </Label>
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
                  {notificationSettings.recurringGeneratedEnabled && (
                    <div className="ml-6">
                      <p className="text-xs text-muted-foreground">
                        ℹ️ 繰り返しタスクが生成されたら通知
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* テスト通知ボタン */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  className="w-full"
                >
                  <Bell size={16} className="mr-2" />
                  通知をテスト
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
