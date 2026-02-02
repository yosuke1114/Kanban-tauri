# 繰り返しタスク管理機能 - 実装案

**作成日**: 2026-02-02
**課題**: 繰り返しタスクが無限に増殖し、管理が困難になる

---

## 🔴 現状の問題点

### 1. 無限増殖の問題
```
毎週のタスク「週報作成」
→ 52週 × 年数 = 数百件のタスクが蓄積
→ パフォーマンス低下、検索困難
```

### 2. 履歴管理の欠如
- 過去の完了タスクと今後のタスクが混在
- どれが繰り返しタスクか分かりづらい
- 完了履歴を確認できない

### 3. 一括操作の不足
- 「週報作成」の繰り返しを停止したい → 各インスタンスを手動削除
- 繰り返し設定を変更したい → 全インスタンスを手動編集
- スキップしたい → 削除するしかない

### 4. ビジネスロジックの課題
- 祝日スキップ不可
- 複雑な繰り返しパターン未対応（第2・第4月曜など）

---

## 💡 解決策の選択肢

### 案1: テンプレート方式（親子関係）⭐️⭐️⭐️推奨

**概念:**
```
繰り返しタスクテンプレート（親）
  ├─ インスタンス1（2026-01-06完了）
  ├─ インスタンス2（2026-01-13完了）
  ├─ インスタンス3（2026-01-20進行中）← 現在
  └─ 未生成（2026-01-27以降）← generateRecurringTasksで生成
```

**データ構造:**
```typescript
interface RecurringTaskTemplate {
  id: string;
  title: string;
  description?: string;
  recurrence: RecurrenceRule;
  isActive: boolean; // 繰り返しを停止
  createdAt: string;
  // ... その他設定
}

interface Task {
  // 既存フィールド
  templateId?: string; // 繰り返しタスクの場合のみ
  instanceDate?: string; // このインスタンスの期限日
  isRecurring: boolean; // UIでの判別用
}
```

**メリット:**
- ✅ テンプレート編集で全インスタンスに反映
- ✅ テンプレート削除で一括停止
- ✅ 履歴管理が容易
- ✅ パフォーマンス向上（テンプレート数のみ管理）

**デメリット:**
- ⚠️ データ構造の大幅変更
- ⚠️ マイグレーション必要

---

### 案2: グループ化方式（タグベース）⭐️⭐️

**概念:**
```typescript
interface Task {
  // 既存フィールド
  recurringGroupId?: string; // 同じ繰り返しタスクのグループID
  recurrenceStartDate?: string; // 繰り返し開始日
}

// グループIDで同じ繰り返しタスクを特定
const weeklyReportTasks = tasks.filter(t =>
  t.recurringGroupId === "group-weekly-report"
);
```

**メリット:**
- ✅ データ構造変更が小さい
- ✅ 既存タスクとの互換性

**デメリット:**
- ⚠️ 全インスタンスが常にストレージに存在
- ⚠️ パフォーマンス課題は残る

---

### 案3: 自動アーカイブ方式（シンプル）⭐️

**概念:**
```typescript
// 完了から3ヶ月経過した繰り返しタスクを自動アーカイブ
interface RecurrenceRule {
  // 既存フィールド
  autoArchiveAfterDays?: number; // デフォルト90日
}
```

**実装:**
```typescript
cleanupRecurringTasks: () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const toArchive = tasks.filter(task =>
    task.recurrence &&
    task.status === "done" &&
    new Date(task.completedAt) < threeMonthsAgo
  );

  toArchive.forEach(task => archiveTask(task.id));
}
```

**メリット:**
- ✅ 実装が超簡単
- ✅ データ構造変更不要
- ✅ 既存機能（アーカイブ）活用

**デメリット:**
- ⚠️ 一括操作は未解決
- ⚠️ 履歴管理は限定的

---

## 🎯 推奨実装案：段階的アプローチ

### Phase 1: 自動アーカイブ（即効性）⭐️最優先
**工数:** 1日

```typescript
// useBoardStore.ts
cleanupRecurringTasks: () => {
  const state = get();
  const board = state.boards[state.currentBoardId];
  if (!board) return 0;

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 3);

  const toArchive = Object.values(board.tasks).filter((task) => {
    return (
      task.recurrence && // 繰り返しタスク
      task.columnId === "done" && // 完了済み
      task.completedAt &&
      new Date(task.completedAt) < cutoffDate
    );
  });

  toArchive.forEach((task) => {
    // アーカイブ処理（既存のarchiveTask利用）
    state.archiveTask(task.id);
  });

  return toArchive.length;
}
```

**実行タイミング:**
- 日次バッチ処理に追加
- TrashManager/ArchiveManager開くとき

---

### Phase 2: 繰り返しタスク管理UI（中期）⭐️
**工数:** 3-4日

**新規コンポーネント:**
```
RecurringTaskManager.tsx
├─ テンプレート一覧
├─ 各テンプレートの設定
│  ├─ 繰り返しON/OFF（一時停止）
│  ├─ 次回生成日の確認
│  └─ インスタンス履歴
└─ 一括操作
   ├─ 今後の生成を停止
   └─ 全インスタンス削除
```

**データ拡張:**
```typescript
interface Task {
  recurringGroupId?: string; // グループID
  recurringPaused?: boolean; // 一時停止フラグ
}
```

**機能:**
1. 繰り返しタスク一覧表示
2. 一時停止/再開
3. 次回生成のスキップ
4. インスタンス履歴表示
5. グループ削除

---

### Phase 3: テンプレート方式（長期）⭐️
**工数:** 1-2週間

**完全な親子関係実装**
- マイグレーションスクリプト
- テンプレート専用UI
- 詳細な履歴管理
- 複雑な繰り返しパターン対応

---

## 📊 実装優先度と効果

| Phase | 優先度 | 工数 | 効果 | 実装難易度 |
|-------|--------|------|------|-----------|
| Phase 1: 自動アーカイブ | 🔴 HIGH | 1日 | ⭐️⭐️⭐️ | ★☆☆ 低 |
| Phase 2: 管理UI | 🟡 MED | 3-4日 | ⭐️⭐️⭐️⭐️ | ★★☆ 中 |
| Phase 3: テンプレート | 🟢 LOW | 1-2週 | ⭐️⭐️⭐️⭐️⭐️ | ★★★ 高 |

---

## 🚀 すぐに実装できるPhase 1詳細

### 実装ファイル

**1. useBoardStore.ts**
```typescript
interface BoardStore extends BoardStoreState {
  // 既存メソッド...
  cleanupRecurringTasks: () => number; // 追加
}

// 実装
cleanupRecurringTasks: () => {
  const state = get();
  const board = state.boards[state.currentBoardId];
  if (!board) return 0;

  const ARCHIVE_AFTER_MONTHS = 3;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_AFTER_MONTHS);

  const recurringDoneTasks = Object.values(board.tasks).filter((task) => {
    if (!task.recurrence) return false;
    if (task.columnId !== "done") return false;
    if (!task.completedAt) return false;

    const completedDate = new Date(task.completedAt);
    return completedDate < cutoffDate;
  });

  if (recurringDoneTasks.length === 0) return 0;

  // アーカイブ実行
  recurringDoneTasks.forEach((task) => {
    get().archiveTask(task.id);
  });

  console.log(
    `[繰り返しタスククリーンアップ] ${recurringDoneTasks.length}件をアーカイブしました`
  );

  return recurringDoneTasks.length;
}
```

**2. App.tsx - 日次バッチに追加**
```typescript
useEffect(() => {
  const checkDaily = () => {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('lastCleanupDate');

    if (lastCheck !== today) {
      // 既存: 期限切れタスク削除
      const deletedCount = cleanupExpiredTasks();

      // 追加: 繰り返しタスクアーカイブ
      const archivedCount = cleanupRecurringTasks();

      if (deletedCount > 0 || archivedCount > 0) {
        console.log(
          `[日次クリーンアップ] 削除:${deletedCount}件、アーカイブ:${archivedCount}件`
        );
      }

      localStorage.setItem('lastCleanupDate', today);
    }
  };

  checkDaily();
  const interval = setInterval(checkDaily, 60 * 60 * 1000);
  return () => clearInterval(interval);
}, [cleanupExpiredTasks, cleanupRecurringTasks]);
```

**3. 設定UI（オプション）**
```typescript
// DataStorageSettings.tsx に追加
<div className="space-y-2">
  <Label>繰り返しタスクのアーカイブ期間</Label>
  <Select defaultValue="3">
    <SelectItem value="1">1ヶ月後</SelectItem>
    <SelectItem value="3">3ヶ月後（推奨）</SelectItem>
    <SelectItem value="6">6ヶ月後</SelectItem>
    <SelectItem value="never">アーカイブしない</SelectItem>
  </Select>
</div>
```

---

## ✅ Phase 1 完了条件

- [ ] `cleanupRecurringTasks()` 実装
- [ ] 日次バッチ処理に統合
- [ ] 3ヶ月経過の完了繰り返しタスクがアーカイブされる
- [ ] ログ出力で確認可能
- [ ] テスト追加・パス

---

## 📝 Phase 2以降の詳細設計（別ドキュメント）

Phase 1完了後、以下を作成:
- `docs/RECURRING_TASK_MANAGER_SPEC.md`
- `docs/RECURRING_TASK_TEMPLATE_DESIGN.md`

---

## 💭 検討事項

### Q1: 3ヶ月は適切か？
**A:** ビジネス用途では四半期レポート対応で3ヶ月が妥当。設定可能にすることも検討。

### Q2: アーカイブ vs 削除？
**A:** アーカイブ推奨。完了履歴は貴重なデータ。必要に応じて後から削除可能。

### Q3: 即座に実装すべきか？
**A:** YES。Phase 1は工数1日で大きな効果。バッチ削除と同時実装推奨。

---

## 🎯 次のアクション

1. **Phase 1実装** - 自動アーカイブ（推奨：今すぐ）
2. **動作確認** - 3ヶ月経過タスクでテスト
3. **Phase 2計画** - UI設計開始

Phase 1を実装しますか？
