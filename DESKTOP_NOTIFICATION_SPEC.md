# デスクトップ通知機能 - 詳細仕様書

**作成日**: 2026-02-02
**バージョン**: 1.0
**ステータス**: 仕様策定中

---

## 📋 目次

1. [概要](#概要)
2. [現状分析](#現状分析)
3. [ユーザーストーリー](#ユーザーストーリー)
4. [機能要件](#機能要件)
5. [データモデル](#データモデル)
6. [UI/UX設計](#uiux設計)
7. [通知ロジック](#通知ロジック)
8. [Tauri統合](#tauri統合)
9. [エッジケース](#エッジケース)
10. [テスト計画](#テスト計画)
11. [実装ロードマップ](#実装ロードマップ)

---

## 📖 概要

### 目的

タスクの期限を見逃さないよう、適切なタイミングでデスクトップ通知を表示し、ビジネスパーソンの生産性を向上させる。

### スコープ

**含まれるもの:**
- 期限24時間前の通知
- 期限当日（9時）の通知
- 期限超過の通知（1日1回）
- 繰り返しタスク生成の通知
- 通知のクリックでタスク編集画面を開く
- 通知設定UI（ON/OFF、時刻設定）

**含まれないもの (v1.0):**
- メール通知
- Slack/Teams連携
- カスタム通知音
- スヌーズ機能
- 通知履歴

---

## 📊 現状分析

### 既存実装の確認

**src/services/notification/notificationService.ts:**
```typescript
// ✅ 既存機能
- requestNotificationPermission(): 通知権限リクエスト
- showNotification(): 基本的な通知表示
- notifyOverdueTasks(): 期限切れタスク通知
- notifyUpcomingTasks(): 期限が近いタスク通知

// ⚠️ 課題
- ブラウザのNotification API使用（Tauriではない）
- クリックイベントハンドリングなし
- 通知設定の永続化なし
```

**src/hooks/useDueDateNotifications.ts:**
```typescript
// ✅ 既存機能
- アプリ起動時に通知（2秒後）
- 毎日9時に通知
- 期限切れと3日以内のタスクをチェック

// ⚠️ 課題
- 24時間前の通知なし
- 期限当日の通知が曖昧（3日以内に含まれる）
- 繰り返しタスク生成の通知なし
```

**src-tauri/tauri.conf.json:**
```json
{
  "notification": {
    "all": true  // ✅ 通知機能は有効化済み
  }
}
```

### 改善点

1. **Tauri Notification APIへの移行**
   - ブラウザAPIからTauri標準APIへ
   - クリックイベントのハンドリング
   - ネイティブ通知の利用

2. **通知タイミングの細分化**
   - 24時間前（明日の期限）
   - 当日9時（今日の期限）
   - 期限超過（毎日9時）

3. **通知設定の追加**
   - 各通知のON/OFF
   - 通知時刻のカスタマイズ
   - 設定の永続化

4. **通知内容の充実**
   - タスクタイトル
   - 期限日時
   - 優先度アイコン
   - クリックでタスク編集画面

---

## 👤 ユーザーストーリー

### US-1: 期限24時間前の通知

**As a** ビジネスパーソン
**I want to** 期限の24時間前に通知を受け取りたい
**So that** 余裕を持って準備できる

**受け入れ基準:**
- [ ] 期限24時間前（デフォルト: 前日9時）に通知が表示される
- [ ] 通知には「明日が期限: [タスク名]」と表示される
- [ ] 通知をクリックするとタスク編集画面が開く
- [ ] 設定で通知時刻を変更できる

### US-2: 期限当日の通知

**As a** プロジェクトマネージャー
**I want to** 期限当日の朝に通知を受け取りたい
**So that** その日のうちに完了させられる

**受け入れ基準:**
- [ ] 期限当日（デフォルト: 9時）に通知が表示される
- [ ] 通知には「今日が期限: [タスク名]」と表示される
- [ ] 複数タスクある場合は件数を表示
- [ ] 通知をクリックするとタスク一覧が開く

### US-3: 期限超過の通知

**As a** ユーザー
**I want to** 期限超過タスクを毎日通知してほしい
**So that** 忘れずに対処できる

**受け入れ基準:**
- [ ] 期限超過タスクがある場合、毎日9時に通知
- [ ] 通知には「期限切れ: [件数]件」と表示される
- [ ] 通知をクリックするとフィルター済みのタスク一覧が開く
- [ ] 設定でOFF可能

### US-4: 繰り返しタスク生成の通知

**As a** ユーザー
**I want to** 繰り返しタスクが生成されたら通知してほしい
**So that** 新しいタスクに気づける

**受け入れ基準:**
- [ ] 繰り返しタスクが生成されたときに通知
- [ ] 通知には「繰り返しタスクを生成: [タスク名]」と表示される
- [ ] 設定でOFF可能

### US-5: 通知設定のカスタマイズ

**As a** ユーザー
**I want to** 通知の設定をカスタマイズしたい
**So that** 自分の働き方に合わせられる

**受け入れ基準:**
- [ ] 設定画面で各通知のON/OFFを切り替えられる
- [ ] 通知時刻を変更できる（24時間前、当日、期限超過）
- [ ] 設定が永続化される

### US-6: 通知からタスクを開く

**As a** ユーザー
**I want to** 通知をクリックしてタスクを直接開きたい
**So that** すぐに作業に取り掛かれる

**受け入れ基準:**
- [ ] 通知クリックでアプリがフォアグラウンドになる
- [ ] 該当タスクの編集ダイアログが開く
- [ ] 複数タスクの場合はフィルター済み一覧が表示される

---

## ⚙️ 機能要件

### FR-1: 期限24時間前の通知

**優先度:** P0 (必須)

**詳細:**
- 期限の24時間前に通知を表示
- デフォルト通知時刻: 前日9時
- 設定で時刻変更可能（1-23時）
- 完了済みタスクは除外

**通知内容:**
```
タイトル: 明日が期限のタスク (2件)
本文:
  - 週報作成 (優先度: 高)
  - 請求書発行 (優先度: 中)
アイコン: アプリアイコン
タグ: due-tomorrow
```

### FR-2: 期限当日の通知

**優先度:** P0 (必須)

**詳細:**
- 期限当日の朝に通知を表示
- デフォルト通知時刻: 9時
- 設定で時刻変更可能（1-23時）
- 完了済みタスクは除外

**通知内容:**
```
タイトル: 今日が期限のタスク (3件)
本文:
  - プレゼン資料作成 (優先度: 緊急)
  - クライアント連絡 (優先度: 高)
  - ...
アイコン: アプリアイコン
タグ: due-today
```

### FR-3: 期限超過の通知

**優先度:** P1 (重要)

**詳細:**
- 期限超過タスクを毎日通知
- デフォルト通知時刻: 9時
- 設定でON/OFF可能
- 完了済みタスクは除外

**通知内容:**
```
タイトル: 期限切れのタスク (5件)
本文:
  タスクを確認してください
アイコン: アプリアイコン（警告色）
タグ: overdue
```

### FR-4: 繰り返しタスク生成の通知

**優先度:** P2 (将来対応)

**詳細:**
- 繰り返しタスクが生成されたときに通知
- 即座に表示（生成直後）
- 設定でON/OFF可能

**通知内容:**
```
タイトル: 繰り返しタスクを生成しました
本文: 週報作成 (期限: 2026-02-10)
アイコン: アプリアイコン
タグ: recurring-generated
```

### FR-5: 通知クリックイベント

**優先度:** P0 (必須)

**詳細:**
- 通知クリックでアプリをフォアグラウンドに
- 単一タスク: EditTaskDialogを開く
- 複数タスク: フィルター済み一覧を表示
- 期限超過: フィルターで期限切れタスクのみ表示

### FR-6: 通知設定UI

**優先度:** P0 (必須)

**詳細:**
- 設定画面で通知のON/OFF
- 通知時刻のカスタマイズ
- 設定の永続化（localStorage）
- デフォルト値の提供

---

## 🗄️ データモデル

### NotificationSettings（新規型）

```typescript
export interface NotificationSettings {
  enabled: boolean; // 通知機能全体のON/OFF

  // 期限24時間前
  due24HoursEnabled: boolean;
  due24HoursTime: number; // 0-23時

  // 期限当日
  dueTodayEnabled: boolean;
  dueTodayTime: number; // 0-23時

  // 期限超過
  overdueEnabled: boolean;
  overdueTime: number; // 0-23時

  // 繰り返しタスク生成
  recurringGeneratedEnabled: boolean;
}

// デフォルト設定
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  due24HoursEnabled: true,
  due24HoursTime: 9,
  dueTodayEnabled: true,
  dueTodayTime: 9,
  overdueEnabled: true,
  overdueTime: 9,
  recurringGeneratedEnabled: true,
};
```

### NotificationState（内部状態）

```typescript
interface NotificationState {
  // 最後に通知した日時（重複防止）
  lastNotified: {
    due24Hours: string | null; // ISO日付（日付のみ）
    dueToday: string | null;
    overdue: string | null;
  };
}
```

### AppState拡張

```typescript
export interface AppState {
  // 既存フィールド...
  notificationSettings?: NotificationSettings; // 新規（オプショナル）
}
```

---

## 🎨 UI/UX設計

### 1. 通知設定画面

**新規コンポーネント:** NotificationSettings.tsx

**配置:** 設定ダイアログ内の新しいタブ

**レイアウト:**

```
┌────────────────────────────────────────────┐
│ ⚙️ 設定                                     │
├────────────────────────────────────────────┤
│ [データ管理] [通知] [表示] [キーボード]    │
│              ^^^^^^ 新規タブ               │
├────────────────────────────────────────────┤
│                                            │
│ 🔔 デスクトップ通知                         │
│                                            │
│ [✓] 通知を有効にする                        │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ 📅 期限24時間前の通知                       │
│ [✓] 有効                                   │
│     通知時刻: [9:00 ▼]                     │
│     ℹ️ 期限の24時間前に通知します           │
│                                            │
│ 📅 期限当日の通知                           │
│ [✓] 有効                                   │
│     通知時刻: [9:00 ▼]                     │
│     ℹ️ 期限当日の朝に通知します             │
│                                            │
│ ⚠️ 期限超過の通知                           │
│ [✓] 有効                                   │
│     通知時刻: [9:00 ▼]                     │
│     ℹ️ 期限を過ぎたタスクを毎日通知します    │
│                                            │
│ 🔁 繰り返しタスク生成の通知                 │
│ [✓] 有効                                   │
│     ℹ️ 繰り返しタスクが生成されたら通知     │
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ [通知をテスト]  <- テスト通知ボタン         │
│                                            │
└────────────────────────────────────────────┘
```

### 2. 通知の表示例

**macOS:**
```
┌────────────────────────────────┐
│ 📋 Kanban Board                │
│ 明日が期限のタスク (2件)        │
│ - 週報作成 (優先度: 高)         │
│ - 請求書発行 (優先度: 中)       │
│                                │
│ 2分前                          │
└────────────────────────────────┘
```

**Windows:**
```
┌────────────────────────────────┐
│ 📋 Kanban Board                │
│ 今日が期限のタスク (3件)        │
│                                │
│ - プレゼン資料作成 (優先度: 緊急)│
│ - クライアント連絡 (優先度: 高) │
│ - ...                          │
└────────────────────────────────┘
```

### 3. アクセス方法

**ヘッダーメニューから:**
```
⚙️ 設定 > 通知タブ
```

**通知権限リクエストダイアログ:**

初回起動時に表示:

```
┌────────────────────────────────────────┐
│ 🔔 デスクトップ通知を有効にしますか？   │
├────────────────────────────────────────┤
│                                        │
│ タスクの期限を見逃さないよう、適切な   │
│ タイミングで通知をお送りします。       │
│                                        │
│ 通知内容:                              │
│ • 期限24時間前                         │
│ • 期限当日                             │
│ • 期限超過                             │
│                                        │
│ 後で設定から変更できます。             │
│                                        │
│ [後で]  [通知を有効にする]             │
└────────────────────────────────────────┘
```

---

## 🔧 通知ロジック

### 1. 通知スケジューリング

**useDueDateNotifications.ts（改良版）:**

```typescript
import { useEffect, useRef } from "react";
import { useBoardStore } from "@/stores/useBoardStore";
import { isPermissionGranted, sendNotification } from "@tauri-apps/api/notification";

export function useDueDateNotifications() {
  const tasks = useBoardStore((state) => state.tasks);
  const settings = useBoardStore(
    (state) => state.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS
  );

  // 最後に通知した日付を記録
  const lastNotifiedRef = useRef<NotificationState>({
    lastNotified: {
      due24Hours: null,
      dueToday: null,
      overdue: null,
    },
  });

  // 初回: 通知権限リクエスト
  useEffect(() => {
    if (settings.enabled) {
      requestNotificationPermission();
    }
  }, [settings.enabled]);

  // 定期チェック（1分ごと）
  useEffect(() => {
    if (!settings.enabled) return;

    const checkNotifications = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const today = now.toISOString().split("T")[0];

      const allTasks = Object.values(tasks).filter(
        (task) => task.status === "active" && task.columnId !== "done"
      );

      // 期限24時間前の通知
      if (
        settings.due24HoursEnabled &&
        currentHour === settings.due24HoursTime &&
        lastNotifiedRef.current.lastNotified.due24Hours !== today
      ) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const tasksDueTomorrow = allTasks.filter(
          (task) => task.dueDate === tomorrowStr
        );

        if (tasksDueTomorrow.length > 0) {
          await notifyDueTomorrow(tasksDueTomorrow);
          lastNotifiedRef.current.lastNotified.due24Hours = today;
        }
      }

      // 期限当日の通知
      if (
        settings.dueTodayEnabled &&
        currentHour === settings.dueTodayTime &&
        lastNotifiedRef.current.lastNotified.dueToday !== today
      ) {
        const tasksDueToday = allTasks.filter(
          (task) => task.dueDate === today
        );

        if (tasksDueToday.length > 0) {
          await notifyDueToday(tasksDueToday);
          lastNotifiedRef.current.lastNotified.dueToday = today;
        }
      }

      // 期限超過の通知
      if (
        settings.overdueEnabled &&
        currentHour === settings.overdueTime &&
        lastNotifiedRef.current.lastNotified.overdue !== today
      ) {
        const overdueTasks = allTasks.filter((task) => {
          if (!task.dueDate) return false;
          return task.dueDate < today;
        });

        if (overdueTasks.length > 0) {
          await notifyOverdue(overdueTasks);
          lastNotifiedRef.current.lastNotified.overdue = today;
        }
      }
    };

    // 初回チェック
    checkNotifications();

    // 1分ごとにチェック
    const interval = setInterval(checkNotifications, 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, settings]);
}
```

### 2. 通知表示ロジック

**notificationService.ts（改良版）:**

```typescript
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";
import { Task } from "@/types";

export async function requestNotificationPermission(): Promise<boolean> {
  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }

  return permissionGranted;
}

export async function notifyDueTomorrow(tasks: Task[]) {
  const title = `明日が期限のタスク (${tasks.length}件)`;
  const body = tasks
    .slice(0, 3)
    .map((t) => `- ${t.title} (優先度: ${PRIORITY_LABELS[t.priority]})`)
    .join("\n");

  await sendNotification({
    title,
    body,
    icon: "icon.png",
  });
}

export async function notifyDueToday(tasks: Task[]) {
  const title = `今日が期限のタスク (${tasks.length}件)`;
  const body = tasks
    .slice(0, 3)
    .map((t) => `- ${t.title} (優先度: ${PRIORITY_LABELS[t.priority]})`)
    .join("\n");

  await sendNotification({
    title,
    body,
    icon: "icon.png",
  });
}

export async function notifyOverdue(tasks: Task[]) {
  const title = `期限切れのタスク (${tasks.length}件)`;
  const body = "タスクを確認してください";

  await sendNotification({
    title,
    body,
    icon: "icon.png",
  });
}

export async function notifyRecurringTaskGenerated(task: Task) {
  const title = "繰り返しタスクを生成しました";
  const body = `${task.title} (期限: ${task.dueDate || "未設定"})`;

  await sendNotification({
    title,
    body,
    icon: "icon.png",
  });
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};
```

### 3. 通知クリックイベント（Phase 2）

Tauri v1では通知クリックイベントのハンドリングが制限されています。v2で改善予定。

**現状の対応:**
- 通知クリックでアプリがフォアグラウンドになる（OS標準動作）
- 特定タスクを開く機能はPhase 2（Tauri v2移行後）で実装

---

## 🐛 エッジケース

### EC-1: アプリが起動していない場合

**問題:**
アプリが起動していない場合、通知を送信できない

**解決策 (v1.0):**
- アプリ起動時に当日分の通知をチェック
- 「起動時のまとめ通知」として表示

**将来対応 (v2.0):**
- バックグラウンドサービス（Tauri v2）
- システムスケジューラー統合

### EC-2: 通知が重複する場合

**問題:**
アプリを再起動すると同じ通知が再度表示される可能性

**解決策:**
- `lastNotified`ステートをlocalStorageに永続化
- 日付単位で重複チェック

```typescript
// localStorage key
const NOTIFICATION_STATE_KEY = "notificationState";

// 保存
localStorage.setItem(
  NOTIFICATION_STATE_KEY,
  JSON.stringify(lastNotifiedRef.current)
);

// 読み込み
const savedState = localStorage.getItem(NOTIFICATION_STATE_KEY);
if (savedState) {
  lastNotifiedRef.current = JSON.parse(savedState);
}
```

### EC-3: タイムゾーン変更

**問題:**
ユーザーがタイムゾーンを変更した場合、通知タイミングがずれる

**解決策 (v1.0):**
- ローカル時刻で処理（現行のまま）
- タイムゾーン変更後は次回起動時に自動調整

### EC-4: 大量のタスクがある場合

**問題:**
通知に表示するタスクが多すぎる（例: 30件）

**解決策:**
- 最大3件まで表示
- 残りは件数のみ表示
- 優先度順にソート

```typescript
const sortedTasks = tasks
  .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])
  .slice(0, 3);
```

### EC-5: 通知権限が拒否された場合

**問題:**
ユーザーが通知権限を拒否した場合

**解決策:**
- 設定画面に警告メッセージを表示
- アプリ内通知（トースト）にフォールバック
- OS設定での変更方法を案内

```
⚠️ 通知権限が拒否されています
システム設定から通知を有効にしてください。
[設定を開く（予定）]
```

---

## 🧪 テスト計画

### ユニットテスト

**notificationService.test.ts（拡張）:**

```typescript
import { describe, it, expect, vi } from "vitest";
import { notifyDueTomorrow, notifyDueToday, notifyOverdue } from "./notificationService";
import * as tauriNotification from "@tauri-apps/api/notification";

vi.mock("@tauri-apps/api/notification");

describe("Notification Service", () => {
  it("期限24時間前の通知が正しく表示される", async () => {
    const tasks = [
      { id: "1", title: "週報作成", priority: "high", dueDate: "2026-02-03" },
      { id: "2", title: "請求書発行", priority: "medium", dueDate: "2026-02-03" },
    ];

    await notifyDueTomorrow(tasks);

    expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
      title: "明日が期限のタスク (2件)",
      body: expect.stringContaining("週報作成"),
      icon: "icon.png",
    });
  });

  it("期限当日の通知が正しく表示される", async () => {
    const tasks = [
      { id: "1", title: "プレゼン資料", priority: "urgent", dueDate: "2026-02-02" },
    ];

    await notifyDueToday(tasks);

    expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
      title: "今日が期限のタスク (1件)",
      body: expect.stringContaining("プレゼン資料"),
      icon: "icon.png",
    });
  });

  it("期限超過の通知が正しく表示される", async () => {
    const tasks = [
      { id: "1", title: "遅延タスク1", priority: "high", dueDate: "2026-01-30" },
      { id: "2", title: "遅延タスク2", priority: "medium", dueDate: "2026-01-31" },
    ];

    await notifyOverdue(tasks);

    expect(tauriNotification.sendNotification).toHaveBeenCalledWith({
      title: "期限切れのタスク (2件)",
      body: "タスクを確認してください",
      icon: "icon.png",
    });
  });

  it("タスクがない場合は通知しない", async () => {
    await notifyDueTomorrow([]);
    expect(tauriNotification.sendNotification).not.toHaveBeenCalled();
  });

  it("4件以上のタスクは3件まで表示", async () => {
    const tasks = [
      { id: "1", title: "タスク1", priority: "high", dueDate: "2026-02-03" },
      { id: "2", title: "タスク2", priority: "medium", dueDate: "2026-02-03" },
      { id: "3", title: "タスク3", priority: "low", dueDate: "2026-02-03" },
      { id: "4", title: "タスク4", priority: "low", dueDate: "2026-02-03" },
    ];

    await notifyDueTomorrow(tasks);

    const call = vi.mocked(tauriNotification.sendNotification).mock.calls[0][0];
    const bodyLines = call.body.split("\n");
    expect(bodyLines.length).toBeLessThanOrEqual(3);
  });
});
```

### E2Eテスト（手動）

通知はOSレベルの機能のため、E2Eは手動テストで実施:

```typescript
// src/components/settings/NotificationSettings.tsx

// テスト通知ボタン
<Button onClick={handleTestNotification}>
  通知をテスト
</Button>

const handleTestNotification = async () => {
  await sendNotification({
    title: "テスト通知",
    body: "通知が正しく設定されています",
    icon: "icon.png",
  });

  toast({
    title: "テスト通知を送信しました",
  });
};
```

**テストシナリオ:**

1. **通知権限テスト**
   - 初回起動で権限リクエストが表示される
   - 許可後、通知が表示される

2. **期限24時間前の通知**
   - 明日が期限のタスクを作成
   - 翌日9時に通知が表示される

3. **設定変更テスト**
   - 通知時刻を11時に変更
   - 11時に通知が表示される

4. **通知OFF**
   - 設定で通知をOFF
   - 通知が表示されないことを確認

---

## 🗓️ 実装ロードマップ

### Day 1-2: Tauri Notification API統合

**目標:** ブラウザAPIからTauri APIへ移行

**タスク:**
- [ ] notificationService.tsをTauri API使用に書き換え
- [ ] @tauri-apps/api/notificationのインポート
- [ ] requestNotificationPermission()の実装
- [ ] sendNotification()の実装
- [ ] ユニットテスト更新

**成果物:**
- `src/services/notification/notificationService.ts` 更新
- `src/services/notification/notificationService.test.ts` 更新

### Day 2-3: 通知ロジックの改良

**目標:** 期限24時間前、当日、超過の通知実装

**タスク:**
- [ ] useDueDateNotifications.tsの改良
- [ ] 1分ごとのチェックロジック実装
- [ ] lastNotifiedステートの永続化
- [ ] notifyDueTomorrow()実装
- [ ] notifyDueToday()実装
- [ ] notifyOverdue()実装

**成果物:**
- `src/hooks/useDueDateNotifications.ts` 更新

### Day 3-4: 通知設定UI

**目標:** 通知設定画面の作成

**タスク:**
- [ ] NotificationSettings.tsx作成
- [ ] NotificationSettings型定義
- [ ] AppStateへの統合
- [ ] 設定の永続化（localStorage）
- [ ] テスト通知ボタン実装

**成果物:**
- `src/types/index.ts` 更新（NotificationSettings型追加）
- `src/components/settings/NotificationSettings.tsx` 新規作成
- `src/stores/useBoardStore.ts` 更新（設定の保存・読み込み）

### Day 4: テスト・ドキュメント

**目標:** テスト実施とドキュメント整備

**タスク:**
- [ ] ユニットテスト追加・実行
- [ ] 手動E2Eテスト実施
- [ ] 通知権限リクエストダイアログの実装（オプション）
- [ ] ユーザーマニュアル更新

**成果物:**
- テスト結果レポート
- ユーザーマニュアル（通知設定セクション）

---

## ✅ 完了条件

### Phase 7.2完了の定義

- [x] **Tauri Notification API統合**
  - [ ] ブラウザAPIからTauri APIへ移行完了
  - [ ] 通知権限リクエストが正常に動作
  - [ ] 通知が表示される

- [x] **4種類の通知実装**
  - [ ] 期限24時間前の通知が表示される
  - [ ] 期限当日の通知が表示される
  - [ ] 期限超過の通知が表示される
  - [ ] 繰り返しタスク生成の通知が表示される（将来対応）

- [x] **通知設定UI**
  - [ ] 設定画面で各通知のON/OFF切り替え可能
  - [ ] 通知時刻のカスタマイズ可能
  - [ ] 設定が永続化される
  - [ ] テスト通知ボタンが動作する

- [x] **テスト**
  - [ ] ユニットテスト追加・パス
  - [ ] 手動E2Eテスト完了
  - [ ] 各OS（macOS, Windows）で動作確認

---

## 🔗 関連ドキュメント

- [FEATURE_IMPLEMENTATION_PLAN.md](./FEATURE_IMPLEMENTATION_PLAN.md) - Phase 7全体計画
- [Tauri Notification API](https://tauri.app/v1/api/js/notification/) - 公式ドキュメント
- [CLAUDE.md](./CLAUDE.md) - プロジェクト全体ガイド

---

## 📝 備考

### Tauri v1の制限

- **通知クリックイベント**: Tauri v1では通知クリックイベントのハンドリングが制限されています
- **アクションボタン**: 通知にボタンを追加する機能はありません
- **将来対応**: Tauri v2移行時に改善予定

### 技術選択理由

**Tauri Notification API:**
- ネイティブ通知でOS標準の見た目
- クロスプラットフォーム対応
- 軽量で高速

**1分ごとのチェック:**
- バッテリー消費を抑制
- 通知タイミングの精度（±1分）は許容範囲
- バックグラウンドサービス不要

### リスク管理

**リスク1: 通知権限の拒否**
- 対策: 初回起動時に丁寧な説明
- フォールバック: アプリ内トースト通知

**リスク2: 通知の見逃し**
- 対策: アプリ起動時のまとめ通知
- 対策: タスク一覧での視覚的な強調表示

**リスク3: 過度な通知によるユーザー疲労**
- 対策: デフォルトは朝9時のみ
- 対策: 各通知の個別ON/OFF設定
- 対策: 件数を絞った表示（最大3件）

---

**次のステップ:**
このDESKTOP_NOTIFICATION_SPEC.mdをレビューし、承認後にDay 1（Tauri Notification API統合）から実装を開始します。
