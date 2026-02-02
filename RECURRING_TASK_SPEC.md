# 繰り返しタスク機能 - 詳細仕様書

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
7. [ビジネスロジック](#ビジネスロジック)
8. [エッジケース](#エッジケース)
9. [テスト計画](#テスト計画)
10. [実装ロードマップ](#実装ロードマップ)

---

## 📖 概要

### 目的

ビジネスパーソンが日次・週次・月次で繰り返し発生するタスクを効率的に管理できる機能を提供する。

### スコープ

**含まれるもの:**
- 日次・週次・月次の繰り返しパターン
- 繰り返しタスクの作成・編集・削除
- 完了時の次回インスタンス自動生成
- 繰り返しの一時停止・再開
- 繰り返しタスクのグループ管理
- 履歴の表示

**含まれないもの (v1.0):**
- 年次繰り返し（将来対応）
- 複雑な繰り返しパターン（第2・第4月曜など）
- 祝日スキップ機能
- カスタム繰り返しルール（RRULEフル対応）

---

## 📊 現状分析

### 既存実装の確認

**型定義 (src/types/index.ts:22-26):**
```typescript
export interface RecurrenceRule {
  type: "daily" | "weekly" | "monthly";
  interval: number;  // 繰り返し間隔（1=毎日、2=2日おき）
  endDate?: string;  // 繰り返し終了日（オプショナル）
}
```

**生成ロジック (useBoardStore.ts):**
- `generateRecurringTasks()`: アプリ起動時に実行
- 完了済みの繰り返しタスクから新しいインスタンスを生成
- 新インスタンスは「未着手」列に配置

### 既存の課題

1. **無限増殖問題**
   - 完了タスクが蓄積され続ける
   - パフォーマンス低下のリスク

2. **管理機能の欠如**
   - 繰り返しタスクのグループ化なし
   - 一括操作（停止、削除、編集）不可
   - どれが繰り返しタスクか判別困難

3. **柔軟性の不足**
   - 曜日指定なし（週次で「毎週月曜」など）
   - スキップ機能なし
   - 祝日考慮なし

4. **ユーザビリティ**
   - 生成されたタスクの通知なし
   - 履歴表示なし
   - 次回生成日の確認不可

---

## 👤 ユーザーストーリー

### US-1: 日次タスクの設定

**As a** ビジネスパーソン
**I want to** 毎日のレビュータスクを自動生成したい
**So that** 手動で毎日タスクを作る手間を省ける

**受け入れ基準:**
- [ ] タスク作成時に「毎日繰り返す」を選択できる
- [ ] 完了すると翌日のタスクが自動生成される
- [ ] 終了日を設定できる（オプショナル）

### US-2: 週次タスクの設定（曜日指定）

**As a** プロジェクトマネージャー
**I want to** 毎週月曜の週報作成タスクを自動生成したい
**So that** 週初めに必ず週報を書く習慣を維持できる

**受け入れ基準:**
- [ ] タスク作成時に「毎週月曜」を選択できる
- [ ] 複数曜日の指定可能（例: 月・水・金）
- [ ] 前回の完了状況に関わらず指定曜日に生成される

### US-3: 月次タスクの設定

**As a** 経理担当者
**I want to** 毎月末日に請求書発行タスクを自動生成したい
**So that** 請求漏れを防げる

**受け入れ基準:**
- [ ] タスク作成時に「毎月○日」を選択できる
- [ ] 月末（31日がない月の扱い）を指定できる
- [ ] 完了すると翌月の同日にタスクが生成される

### US-4: 繰り返しタスクの一時停止

**As a** ユーザー
**I want to** 休暇中は繰り返しタスクを一時停止したい
**So that** 不要なタスクが溜まらない

**受け入れ基準:**
- [ ] 繰り返しタスク管理画面で一時停止できる
- [ ] 一時停止中は新しいインスタンスが生成されない
- [ ] 再開すると次の予定日から生成が再開される

### US-5: 繰り返しタスクの履歴表示

**As a** ユーザー
**I want to** 過去の繰り返しタスク完了履歴を見たい
**So that** 自分の習慣の継続状況を確認できる

**受け入れ基準:**
- [ ] 繰り返しタスクの履歴一覧を表示できる
- [ ] 完了日時が表示される
- [ ] 未完了（スキップ）も記録される

### US-6: 繰り返しタスクの一括削除

**As a** ユーザー
**I want to** 不要になった繰り返しタスクを一括削除したい
**So that** 将来のインスタンスが生成されなくなる

**受け入れ基準:**
- [ ] 繰り返しタスク管理画面で「今後の生成を停止」できる
- [ ] 既存のインスタンスは残る（オプションで一括削除も可能）
- [ ] 確認ダイアログが表示される

---

## ⚙️ 機能要件

### FR-1: 繰り返しパターンの設定

**優先度:** P0 (必須)

**詳細:**
- 日次繰り返し: interval指定（1=毎日、2=2日おき）
- 週次繰り返し: 曜日指定（複数選択可能）
- 月次繰り返し: 日付指定（1-31、または"last"=月末）
- 終了日設定（オプショナル）

**制約:**
- intervalは1以上の整数
- 週次の場合は少なくとも1つの曜日を選択
- 月次で31日を指定した場合、30日までの月は30日に生成

### FR-2: 自動インスタンス生成

**優先度:** P0 (必須)

**詳細:**
- アプリ起動時に未生成のインスタンスをチェック
- 完了済みタスクから次回インスタンスを生成
- 新インスタンスは指定された列（デフォルト: 未着手）に配置
- 生成時にトースト通知を表示

**生成タイミング:**
- 日次: 完了した翌日
- 週次: 指定曜日（完了状況に関わらず）
- 月次: 指定日（完了状況に関わらず）

**生成先列の決定:**
- ユーザー設定で指定可能
- デフォルト: 「未着手」列

### FR-3: 繰り返しタスク管理UI

**優先度:** P1 (重要)

**提供機能:**
- 繰り返しタスク一覧表示
- 一時停止/再開
- 次回生成日の表示
- インスタンス履歴の表示
- グループ削除（今後の生成停止）

**アクセス方法:**
- ヘッダーメニューから「繰り返しタスク管理」を選択
- キーボードショートカット: `Shift+R`

### FR-4: テンプレート方式（Phase 3）

**優先度:** P2 (将来対応)

**概念:**
- 繰り返しタスクテンプレート（親）を定義
- テンプレートから個別インスタンス（子）を生成
- テンプレート編集で全インスタンスに反映

**メリット:**
- パフォーマンス向上（テンプレート数のみ管理）
- 一括編集が容易
- 履歴管理が明確

---

## 🗄️ データモデル

### 現行モデル (v1.0)

**Task拡張:**
```typescript
export interface Task {
  // 既存フィールド...
  recurrence?: RecurrenceRule;
  recurringGroupId?: string;  // 同じ繰り返しタスクのグループID（新規）
  recurringPaused?: boolean;  // 一時停止フラグ（新規）
}

export interface RecurrenceRule {
  type: "daily" | "weekly" | "monthly";
  interval: number;

  // 週次用（新規）
  daysOfWeek?: number[];  // 0=日曜, 1=月曜, ..., 6=土曜

  // 月次用（新規）
  dayOfMonth?: number | "last";  // 1-31 または "last"

  endDate?: string;

  // 生成先列（新規）
  targetColumnId?: string;  // デフォルト: "todo"
}
```

### 将来モデル (v2.0 - テンプレート方式)

**RecurringTaskTemplate (新規型):**
```typescript
export interface RecurringTaskTemplate {
  id: string;
  title: string;
  description?: string;
  recurrence: RecurrenceRule;
  isActive: boolean;  // 繰り返しを停止

  // デフォルト設定
  defaultPriority: Priority;
  defaultAssigneeIds: string[];
  defaultTagIds: string[];
  defaultColumnId: string;

  createdAt: string;
  updatedAt: string;
}

export interface Task {
  // 既存フィールド...
  templateId?: string;        // 繰り返しタスクの場合のみ
  instanceDate?: string;      // このインスタンスの期限日
  isRecurring: boolean;       // UIでの判別用
  completedAt?: string;       // 完了日時（履歴用）
}
```

---

## 🎨 UI/UX設計

### 1. タスク作成時の繰り返し設定

**配置:** EditTaskDialog (src/components/task/EditTaskDialog.tsx)

**UI要素:**

```
┌─────────────────────────────────────┐
│ [🔁] 繰り返し設定                    │
├─────────────────────────────────────┤
│ ⚪ 繰り返さない                      │
│ ⚫ 繰り返す                          │
│                                     │
│ 種類: [毎日 ▼] [毎週 ▼] [毎月 ▼]   │
│                                     │
│ (毎日の場合)                         │
│   間隔: [1] 日ごと                   │
│                                     │
│ (毎週の場合)                         │
│   曜日: [☑月] [☐火] [☐水] [☐木]     │
│        [☐金] [☐土] [☐日]            │
│                                     │
│ (毎月の場合)                         │
│   日付: [15 ▼] 日                   │
│        (1-31, 月末)                 │
│                                     │
│ 終了日: [____/__/__] (オプション)   │
│                                     │
│ 生成先列: [未着手 ▼]                 │
└─────────────────────────────────────┘
```

### 2. 繰り返しタスク管理画面

**新規コンポーネント:** RecurringTaskManager.tsx

**レイアウト:**

```
┌────────────────────────────────────────────────┐
│ 🔁 繰り返しタスク管理                          │
├────────────────────────────────────────────────┤
│                                                │
│ 📋 アクティブな繰り返しタスク (3)              │
│ ┌──────────────────────────────────────────┐   │
│ │ 🟢 週報作成                               │   │
│ │    毎週月曜 | 次回: 2026-02-08             │   │
│ │    [⏸一時停止] [📝編集] [🗑削除]          │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │ 🟢 日次レビュー                           │   │
│ │    毎日 | 次回: 2026-02-03                 │   │
│ │    [⏸一時停止] [📝編集] [🗑削除]          │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ 📋 一時停止中 (1)                               │
│ ┌──────────────────────────────────────────┐   │
│ │ ⏸ 月次報告書                              │   │
│ │    毎月末日 | 停止中                       │   │
│ │    [▶再開] [📝編集] [🗑削除]              │   │
│ └──────────────────────────────────────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

### 3. タスクカードでの繰り返し表示

**TaskCard修正:**

繰り返しタスクであることを示すバッジを追加:

```typescript
{task.recurrence && (
  <Badge variant="outline" className="text-xs">
    <RefreshCw size={10} className="mr-1" />
    繰り返し
  </Badge>
)}
```

### 4. 履歴表示

**RecurringTaskHistory (新規サブコンポーネント):**

```
┌────────────────────────────────────┐
│ 📊 完了履歴: 週報作成               │
├────────────────────────────────────┤
│ ✅ 2026-02-01 完了 (月曜)           │
│ ✅ 2026-01-25 完了 (月曜)           │
│ ❌ 2026-01-18 スキップ (月曜)       │
│ ✅ 2026-01-11 完了 (月曜)           │
│                                    │
│ 完了率: 75% (3/4)                  │
└────────────────────────────────────┘
```

---

## 🔧 ビジネスロジック

### 1. インスタンス生成ロジック

**generateRecurringTasks() の詳細:**

```typescript
generateRecurringTasks: () => {
  const state = get();
  const board = state.boards[state.currentBoardId];
  if (!board) return;

  const now = new Date();
  const tasks = Object.values(board.tasks);

  tasks.forEach((task) => {
    if (!task.recurrence || task.recurringPaused) return;

    // 完了済みタスクから次回インスタンスを生成
    if (task.columnId === "done" && task.completedAt) {
      const nextDate = calculateNextRecurrence(
        new Date(task.completedAt),
        task.recurrence
      );

      // 終了日チェック
      if (task.recurrence.endDate) {
        const endDate = new Date(task.recurrence.endDate);
        if (nextDate > endDate) return; // 終了日を過ぎている
      }

      // 次回インスタンスが既に存在するかチェック
      const existingNext = tasks.find(
        (t) =>
          t.recurringGroupId === task.recurringGroupId &&
          t.dueDate === nextDate.toISOString().split("T")[0]
      );

      if (!existingNext) {
        // 新規インスタンス作成
        const targetColumnId = task.recurrence.targetColumnId || "todo";
        get().addTask(targetColumnId, task.title, false, {
          ...task,
          id: undefined, // 新しいIDを生成
          columnId: targetColumnId,
          dueDate: nextDate.toISOString().split("T")[0],
          recurringGroupId: task.recurringGroupId || task.id,
          status: "active",
          completedAt: undefined,
        });

        // 通知
        toast({
          title: "繰り返しタスクを生成しました",
          description: `${task.title} (${formatDate(nextDate)})`,
        });
      }
    }
  });
}
```

### 2. 次回日付計算ロジック

**calculateNextRecurrence():**

```typescript
function calculateNextRecurrence(
  baseDate: Date,
  rule: RecurrenceRule
): Date {
  const next = new Date(baseDate);

  switch (rule.type) {
    case "daily":
      next.setDate(next.getDate() + rule.interval);
      break;

    case "weekly":
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // 次の指定曜日を見つける
        const currentDay = next.getDay();
        const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b);

        let nextDay = sortedDays.find((d) => d > currentDay);
        if (!nextDay) {
          // 今週に該当曜日がない → 来週の最初の曜日
          nextDay = sortedDays[0];
          next.setDate(next.getDate() + (7 - currentDay + nextDay));
        } else {
          next.setDate(next.getDate() + (nextDay - currentDay));
        }
      } else {
        // daysOfWeek未指定の場合はinterval週後
        next.setDate(next.getDate() + 7 * rule.interval);
      }
      break;

    case "monthly":
      if (rule.dayOfMonth === "last") {
        // 月末
        next.setMonth(next.getMonth() + rule.interval);
        next.setDate(0); // 前月の最終日 = 当月の0日目
      } else {
        const targetDay = rule.dayOfMonth || next.getDate();
        next.setMonth(next.getMonth() + rule.interval);

        // 月末を超える場合の調整（例: 1/31 → 2/28）
        const daysInMonth = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0
        ).getDate();
        next.setDate(Math.min(targetDay, daysInMonth));
      }
      break;
  }

  return next;
}
```

### 3. 一時停止ロジック

```typescript
pauseRecurringTask: (taskId: string) => {
  const state = get();
  const task = state.boards[state.currentBoardId].tasks[taskId];
  if (!task || !task.recurrence) return;

  // recurringGroupIdを使って同じグループの全タスクを一時停止
  const groupId = task.recurringGroupId || taskId;
  const updatedTasks = { ...state.boards[state.currentBoardId].tasks };

  Object.values(updatedTasks).forEach((t) => {
    if (t.recurringGroupId === groupId || t.id === groupId) {
      updatedTasks[t.id] = {
        ...t,
        recurringPaused: true,
      };
    }
  });

  set((state) => ({
    boards: {
      ...state.boards,
      [state.currentBoardId]: {
        ...state.boards[state.currentBoardId],
        tasks: updatedTasks,
      },
    },
  }));

  get().saveToStorage();
}
```

---

## 🐛 エッジケース

### EC-1: 2月29日の扱い

**問題:**
毎月29日の繰り返しタスクを設定した場合、2月（28日まで）はどうするか？

**解決策:**
- Option A: 2月は28日に生成
- Option B: 2月はスキップ
- **推奨:** Option A（ユーザーの期待に沿う）

**実装:**
```typescript
const daysInMonth = new Date(year, month + 1, 0).getDate();
const adjustedDay = Math.min(targetDay, daysInMonth);
```

### EC-2: 完了せずにスキップされた場合

**問題:**
週次タスクを完了せずに次の週になった場合、新しいインスタンスは生成されるか？

**解決策:**
- 週次・月次は完了状況に関わらず指定日に生成
- 日次は完了しないと次が生成されない（ユーザーの意図）

**実装:**
```typescript
if (rule.type === "daily") {
  // 完了済みのみから生成
  if (task.columnId !== "done") return;
} else {
  // 週次・月次は日付ベースで生成
  if (isAfterScheduledDate(now, task.dueDate, rule)) {
    generateInstance();
  }
}
```

### EC-3: 終了日当日の扱い

**問題:**
終了日が2026-02-28の場合、2026-02-28のインスタンスは生成されるか？

**解決策:**
- 終了日当日までは生成する（`<=` 判定）

**実装:**
```typescript
if (task.recurrence.endDate) {
  const endDate = new Date(task.recurrence.endDate);
  if (nextDate > endDate) return; // 終了日を過ぎている
}
```

### EC-4: タイムゾーン問題

**問題:**
ユーザーがタイムゾーンを跨いだ場合の日付計算

**解決策 (v1.0):**
- ローカル時刻で処理（Dateオブジェクトのデフォルト動作）
- UTC対応は将来検討

### EC-5: 曜日指定の複数選択（月・水・金）

**問題:**
「毎週月・水・金」のタスクを設定した場合、完了後の次回はいつ？

**解決策:**
- 完了日の翌日以降で、最も近い指定曜日に生成

**実装:**
```typescript
const currentDay = completedDate.getDay();
const nextDay = daysOfWeek
  .filter((d) => d > currentDay)
  .sort()[0] || (daysOfWeek[0] + 7);
```

---

## 🧪 テスト計画

### ユニットテスト

**calculateNextRecurrence() のテスト:**

```typescript
describe("calculateNextRecurrence", () => {
  it("日次: 毎日繰り返し", () => {
    const base = new Date("2026-02-01");
    const rule: RecurrenceRule = { type: "daily", interval: 1 };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-02-02");
  });

  it("日次: 2日おき", () => {
    const base = new Date("2026-02-01");
    const rule: RecurrenceRule = { type: "daily", interval: 2 };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-02-03");
  });

  it("週次: 毎週月曜", () => {
    const base = new Date("2026-02-02"); // 月曜
    const rule: RecurrenceRule = {
      type: "weekly",
      interval: 1,
      daysOfWeek: [1] // 月曜
    };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-02-09");
  });

  it("週次: 月・水・金の次（火曜完了）", () => {
    const base = new Date("2026-02-03"); // 火曜
    const rule: RecurrenceRule = {
      type: "weekly",
      interval: 1,
      daysOfWeek: [1, 3, 5] // 月・水・金
    };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-02-05"); // 水曜
  });

  it("月次: 毎月15日", () => {
    const base = new Date("2026-02-15");
    const rule: RecurrenceRule = {
      type: "monthly",
      interval: 1,
      dayOfMonth: 15
    };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-03-15");
  });

  it("月次: 毎月末日", () => {
    const base = new Date("2026-01-31");
    const rule: RecurrenceRule = {
      type: "monthly",
      interval: 1,
      dayOfMonth: "last"
    };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-02-28"); // 2月末
  });

  it("月次: 31日指定で2月の場合", () => {
    const base = new Date("2026-01-31");
    const rule: RecurrenceRule = {
      type: "monthly",
      interval: 1,
      dayOfMonth: 31
    };
    const next = calculateNextRecurrence(base, rule);
    expect(next.toISOString().split("T")[0]).toBe("2026-02-28"); // 2月28日に調整
  });
});
```

### E2Eテスト

**Playwright シナリオ:**

```typescript
test("繰り返しタスク: 日次タスク作成と自動生成", async ({ page }) => {
  // 1. 日次タスク作成
  await page.click('[data-testid="add-task-button"]');
  await page.fill('[data-testid="task-title"]', "日次レビュー");
  await page.click('[data-testid="recurring-checkbox"]');
  await page.selectOption('[data-testid="recurrence-type"]', "daily");
  await page.click('[data-testid="save-task-button"]');

  // 2. タスクを完了
  const task = page.locator('text=日次レビュー').first();
  await task.dragTo(page.locator('[data-testid="column-done"]'));

  // 3. アプリ再起動をシミュレート（generateRecurringTasks呼び出し）
  await page.reload();

  // 4. 翌日のタスクが生成されているか確認
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const expectedDate = tomorrow.toISOString().split("T")[0];

  await expect(page.locator(`text=日次レビュー`).nth(1)).toBeVisible();
});
```

---

## 🗓️ 実装ロードマップ

### Phase 1: 基盤整備（Week 1）

**目標:** データモデル拡張と基本ロジック実装

**タスク:**
- [ ] RecurrenceRule型拡張（daysOfWeek, dayOfMonth追加）
- [ ] Task型拡張（recurringGroupId, recurringPaused追加）
- [ ] calculateNextRecurrence() 実装
- [ ] ユニットテスト追加（calculateNextRecurrence）

**成果物:**
- `src/types/index.ts` 更新
- `src/utils/recurrence.ts` 新規作成
- `src/utils/recurrence.test.ts` 新規作成

### Phase 2: UI拡張（Week 2）

**目標:** 繰り返し設定UIの改善

**タスク:**
- [ ] EditTaskDialogに曜日選択UI追加
- [ ] EditTaskDialogに月次日付選択UI追加
- [ ] TaskCardに繰り返しバッジ表示
- [ ] 生成時のトースト通知

**成果物:**
- `src/components/task/EditTaskDialog.tsx` 更新
- `src/components/task/TaskCard.tsx` 更新

### Phase 3: 管理UI（Week 3）

**目標:** 繰り返しタスク管理画面

**タスク:**
- [ ] RecurringTaskManager.tsx 作成
- [ ] 一覧表示機能
- [ ] 一時停止/再開機能
- [ ] 次回生成日表示

**成果物:**
- `src/components/recurring/RecurringTaskManager.tsx` 新規作成
- `src/components/layout/AppHeader.tsx` メニュー追加

### Phase 4: 履歴・削除（Week 4）

**目標:** 履歴表示と一括削除

**タスク:**
- [ ] 完了履歴の表示
- [ ] グループ削除機能
- [ ] E2Eテスト追加

**成果物:**
- `src/components/recurring/RecurringTaskHistory.tsx` 新規作成
- E2Eテスト追加

### Phase 5: 自動アーカイブ統合（Week 5）

**目標:** RECURRING_TASK_MANAGEMENT.md Phase 1統合

**タスク:**
- [ ] cleanupRecurringTasks() 実装
- [ ] 3ヶ月経過の完了タスクを自動アーカイブ
- [ ] 日次バッチに統合

**成果物:**
- `src/stores/useBoardStore.ts` 更新
- `src/App.tsx` 更新

---

## 📌 今後の拡張

### v2.0: テンプレート方式

- RecurringTaskTemplate型の導入
- テンプレート専用UI
- テンプレート編集による一括更新

### v3.0: 高度な繰り返しパターン

- RRULEフル対応
- 祝日スキップ機能
- カスタムパターン（第2・第4月曜など）

---

## 🔗 関連ドキュメント

- [RECURRING_TASK_MANAGEMENT.md](./RECURRING_TASK_MANAGEMENT.md) - 実装アプローチと段階的計画
- [FEATURE_IMPLEMENTATION_PLAN.md](./FEATURE_IMPLEMENTATION_PLAN.md) - Phase 7全体計画
- [CLAUDE.md](./CLAUDE.md) - プロジェクト全体ガイド

---

## ✅ レビューチェックリスト

仕様レビュー時の確認項目:

- [ ] ユーザーストーリーは明確か
- [ ] 機能要件は実装可能か
- [ ] データモデルは拡張性があるか
- [ ] UI/UXは直感的か
- [ ] エッジケースは網羅されているか
- [ ] テスト計画は十分か
- [ ] 実装ロードマップは現実的か

---

**次のステップ:**
このRECURRING_TASK_SPEC.mdをレビューし、承認後にPhase 1（基盤整備）から実装を開始します。
