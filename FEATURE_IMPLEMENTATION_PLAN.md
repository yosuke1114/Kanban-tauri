# 機能追加実装計画

**作成日**: 2026-02-02
**目的**: ユーザー価値向上のための機能追加と既存機能の明確化

---

## 📋 既存機能の現状確認

### ✅ 繰り返しタスク（実装済み）

**実装状況:**
- ✅ RecurrenceRule型定義済み（daily, weekly, monthly, yearly）
- ✅ `generateRecurringTasks()`: アプリ起動時に自動実行
- ✅ 完了タスクから新インスタンス自動生成（"未着手"列）
- ✅ 終了日設定対応（`endDate`）
- ✅ EditTaskDialogでUI提供

**改善点:**
- ⚠️ 繰り返し設定のヘルプテキストが不足
- ⚠️ 生成されたタスクの通知なし
- 💡 週次繰り返しで曜日指定未対応

**アクション:**
- [ ] ユーザーマニュアルに説明追加
- [ ] 生成時の通知追加（Phase 7.2と統合）
- [ ] （オプション）曜日指定機能追加

---

### ✅ 削除機能（実装済み）

**実装状況:**
- ✅ ソフト削除: `softDeleteTask()` - ゴミ箱に移動
- ✅ 物理削除: `permanentDeleteTask()` - 完全削除
- ✅ 復元機能: `restoreTask()` - ゴミ箱から復元
- ✅ 一括削除: `emptyTrash()` - ゴミ箱を空にする
- ✅ TrashManagerコンポーネントで管理UI提供
- ✅ タブ分離: 削除済み/アーカイブ済み

**削除タイムライン:**
```
タスク → ソフト削除（ゴミ箱移動）→ 30日経過 → 自動物理削除
         ↓
        復元可能（30日間）
```

**改善点:**
- ❌ 30日後の自動削除バッチ未実装
- ⚠️ 削除予定日の表示なし
- ⚠️ 一括復元機能なし

**アクション:**
- [ ] バッチ削除機能実装（Phase 7.1）
- [ ] 削除予定日の表示追加
- [ ] 一括復元ボタン追加

---

## 🎯 Phase 7: 機能追加実装計画

### Phase 7.1: バッチ削除機能（Week 1）✅ 完了

**優先度:** HIGH
**工数:** 2-3日
**ステータス:** ✅ 実装完了（2026-02-02）

#### 実装内容

1. **自動削除バッチ処理**
   - ✅ アプリ起動時に30日経過タスクをチェック
   - ✅ 日次チェック（localStorage + setInterval）
   - ✅ 削除実行時のログ出力

2. **削除予定日表示**
   - ✅ TrashManager内のタスクに削除予定日を表示
   - ✅ 「あと○日で削除」のカウントダウン表示
   - ✅ 削除間近タスクのハイライト（<7日で警告）

3. **一括操作機能**
   - ⏸ 選択した複数タスクを一括復元（将来対応）
   - ⏸ 選択した複数タスクを一括削除（将来対応）
   - ⏸ 全選択/全解除チェックボックス（将来対応）

#### 実装ファイル
- ✅ `src/stores/useBoardStore.ts`: `cleanupExpiredTasks()` メソッド追加
- ✅ `src/components/task/TrashManager.tsx`: UI更新（削除予定日表示、クリーンアップトリガー）
- ✅ `src/App.tsx`: バッチ処理フック追加（日次チェック）

#### テスト
- ✅ 30日経過タスクの自動削除
- ✅ 削除予定日の表示
- ⏸ 一括復元/削除の動作確認（将来対応）

---

### Phase 7.2: デスクトップ通知（Week 2）

**優先度:** HIGH
**工数:** 3-4日

#### 実装内容

1. **通知システム基盤**
   - Tauri notification API統合
   - 通知許可リクエスト
   - 設定画面での通知ON/OFF

2. **通知トリガー**
   - 期限24時間前の通知
   - 期限当日の通知
   - 期限超過の通知（1日1回）
   - 繰り返しタスク生成の通知

3. **通知内容**
   - タスクタイトル
   - 期限日時
   - 優先度表示
   - クリックでタスク編集画面を開く

#### 実装ファイル
- `src/services/notification/notificationService.ts`: 既存拡張
- `src/hooks/useDueDateNotifications.ts`: 既存拡張
- `src/components/settings/NotificationSettings.tsx`: 新規作成
- Tauri設定: `src-tauri/tauri.conf.json`

#### テスト
- [ ] 各トリガーでの通知表示
- [ ] 通知クリック時の動作
- [ ] 設定での通知制御

---

### Phase 7.3: ダークモード（Week 3-4）

**優先度:** MEDIUM-HIGH
**工数:** 4-5日

#### 実装内容

1. **テーマシステム構築**
   - Tailwind CSS dark mode設定
   - カスタムCSSカラー変数拡張
   - テーマ切り替えコンテキスト

2. **テーマ切り替え機能**
   - システムテーマ自動連動
   - 手動切り替え（ライト/ダーク/自動）
   - 設定の永続化（localStorage）

3. **UI調整**
   - 全コンポーネントのダークモード対応
   - カラーコントラスト確認（WCAG AA準拠）
   - アイコン・画像の調整

4. **切り替えUI**
   - ヘッダーにテーマ切り替えボタン追加
   - アイコン: Sun（ライト）/ Moon（ダーク）/ Auto
   - スムーズなトランジション

#### 実装ファイル
- `tailwind.config.js`: darkMode設定
- `src/App.css`: ダークモード用CSS変数
- `src/contexts/ThemeContext.tsx`: 新規作成
- `src/hooks/useTheme.ts`: 新規作成
- `src/components/layout/ThemeToggle.tsx`: 新規作成
- 全コンポーネント: dark:クラス追加

#### テスト
- [ ] システムテーマ連動
- [ ] 手動切り替え動作
- [ ] 設定の永続化
- [ ] 全画面でのカラーコントラスト確認
- [ ] E2Eテスト追加

---

### Phase 7.4: 繰り返しタスク機能拡張（Week 5-9）

**優先度:** HIGH
**工数:** 5週間（段階的実装）
**ステータス:** 仕様策定完了 → 実装待ち

**関連ドキュメント:** [RECURRING_TASK_SPEC.md](./RECURRING_TASK_SPEC.md)

#### 実装内容

**Phase 7.4.1: 基盤整備（Week 5）**
1. **データモデル拡張**
   - RecurrenceRule型拡張（daysOfWeek, dayOfMonth追加）
   - Task型拡張（recurringGroupId, recurringPaused追加）
   - calculateNextRecurrence() 実装
   - ユニットテスト追加

2. **実装ファイル**
   - `src/types/index.ts` 更新
   - `src/utils/recurrence.ts` 新規作成
   - `src/utils/recurrence.test.ts` 新規作成

**Phase 7.4.2: UI拡張（Week 6）**
1. **繰り返し設定UIの改善**
   - EditTaskDialogに曜日選択UI追加
   - EditTaskDialogに月次日付選択UI追加
   - TaskCardに繰り返しバッジ表示
   - 生成時のトースト通知

2. **実装ファイル**
   - `src/components/task/EditTaskDialog.tsx` 更新
   - `src/components/task/TaskCard.tsx` 更新

**Phase 7.4.3: 管理UI（Week 7）**
1. **繰り返しタスク管理画面**
   - RecurringTaskManager.tsx 作成
   - 一覧表示機能
   - 一時停止/再開機能
   - 次回生成日表示

2. **実装ファイル**
   - `src/components/recurring/RecurringTaskManager.tsx` 新規作成
   - `src/components/layout/AppHeader.tsx` メニュー追加

**Phase 7.4.4: 履歴・削除（Week 8）**
1. **履歴表示と一括削除**
   - 完了履歴の表示
   - グループ削除機能
   - E2Eテスト追加

2. **実装ファイル**
   - `src/components/recurring/RecurringTaskHistory.tsx` 新規作成
   - E2Eテスト追加

**Phase 7.4.5: 自動アーカイブ統合（Week 9）**
1. **クリーンアップ機能統合**
   - cleanupRecurringTasks() 実装
   - 3ヶ月経過の完了タスクを自動アーカイブ
   - 日次バッチに統合

2. **実装ファイル**
   - `src/stores/useBoardStore.ts` 更新
   - `src/App.tsx` 更新

#### ユーザーストーリー（主要6件）

1. **US-1:** 日次タスクの設定（毎日のレビュー）
2. **US-2:** 週次タスクの設定（曜日指定）
3. **US-3:** 月次タスクの設定（月末対応）
4. **US-4:** 繰り返しタスクの一時停止
5. **US-5:** 繰り返しタスクの履歴表示
6. **US-6:** 繰り返しタスクの一括削除

#### エッジケース対応

- 2月29日の扱い（月末日に調整）
- 完了せずにスキップされた場合の処理
- 終了日当日の扱い
- タイムゾーン問題（v1.0はローカル時刻で処理）
- 曜日指定の複数選択（月・水・金など）

---

## 📊 実装スケジュール

```
✅ Week 1 (2-3日): Phase 7.1 バッチ削除機能 ← 完了
  Day 1-2: バッチ削除機能実装
  Day 3: テスト・ドキュメント

Week 2 (3-4日): Phase 7.2 デスクトップ通知
  Day 1-2: デスクトップ通知実装
  Day 3: 通知設定UI
  Day 4: テスト・統合

Week 3 (2-3日): Phase 7.3 ダークモード（前半）
  Day 1: テーマシステム構築
  Day 2: UI切り替え実装
  Day 3: テスト

Week 4 (2-3日): Phase 7.3 ダークモード（後半）
  Day 1-2: 全コンポーネントダークモード対応
  Day 3: カラーコントラスト調整・最終テスト

Week 5 (5日): Phase 7.4.1 繰り返しタスク - 基盤整備
  Day 1-2: データモデル拡張
  Day 3-4: calculateNextRecurrence() 実装
  Day 5: ユニットテスト

Week 6 (5日): Phase 7.4.2 繰り返しタスク - UI拡張
  Day 1-3: EditTaskDialog UI改善
  Day 4: TaskCard更新
  Day 5: 通知実装

Week 7 (5日): Phase 7.4.3 繰り返しタスク - 管理UI
  Day 1-3: RecurringTaskManager作成
  Day 4: 一時停止/再開機能
  Day 5: テスト

Week 8 (5日): Phase 7.4.4 繰り返しタスク - 履歴・削除
  Day 1-2: 履歴表示機能
  Day 3-4: グループ削除機能
  Day 5: E2Eテスト

Week 9 (3日): Phase 7.4.5 繰り返しタスク - 自動アーカイブ
  Day 1-2: アーカイブ機能統合
  Day 3: 最終テスト・ドキュメント
```

**Phase 7.1-7.3 工数**: 9-13日（約2-3週間）
**Phase 7.4 工数**: 23日（約5週間）
**合計工数**: 32-36日（約7-8週間）

---

## ✅ 完了条件

### Phase 7.1: バッチ削除 ✅ 完了
- [x] 30日経過タスクの自動削除が動作
- [x] 削除予定日が正確に表示される
- [ ] 一括操作が正常に動作（将来対応）
- [x] テスト追加・パス

### Phase 7.2: デスクトップ通知
- [ ] 4種類の通知が正しく表示される
- [ ] 通知クリックでタスク画面が開く
- [ ] 設定で通知ON/OFFできる
- [ ] テスト追加・パス

### Phase 7.3: ダークモード
- [ ] システムテーマと連動する
- [ ] 手動切り替えが動作する
- [ ] 全画面でカラーコントラスト基準達成
- [ ] 設定が永続化される
- [ ] E2Eテスト追加・パス

### Phase 7.4: 繰り返しタスク機能拡張
- [ ] **Phase 7.4.1: 基盤整備**
  - [ ] RecurrenceRule型拡張（daysOfWeek, dayOfMonth）
  - [ ] Task型拡張（recurringGroupId, recurringPaused）
  - [ ] calculateNextRecurrence() 実装
  - [ ] ユニットテスト追加・パス（15+ テストケース）

- [ ] **Phase 7.4.2: UI拡張**
  - [ ] EditTaskDialogに曜日選択UI追加
  - [ ] EditTaskDialogに月次日付選択UI追加
  - [ ] TaskCardに繰り返しバッジ表示
  - [ ] 生成時のトースト通知

- [ ] **Phase 7.4.3: 管理UI**
  - [ ] RecurringTaskManager作成
  - [ ] 一覧表示機能（アクティブ/一時停止）
  - [ ] 一時停止/再開機能
  - [ ] 次回生成日表示

- [ ] **Phase 7.4.4: 履歴・削除**
  - [ ] 完了履歴の表示
  - [ ] グループ削除機能
  - [ ] E2Eテスト追加・パス

- [ ] **Phase 7.4.5: 自動アーカイブ**
  - [ ] cleanupRecurringTasks() 実装
  - [ ] 3ヶ月経過の完了タスクを自動アーカイブ
  - [ ] 日次バッチに統合
  - [ ] テスト追加・パス

---

## 🔗 関連ドキュメント

- [ROADMAP.md](./ROADMAP.md) - 全体ロードマップ
- [CLAUDE.md](./CLAUDE.md) - 開発ガイド
- [RECURRING_TASK_SPEC.md](./RECURRING_TASK_SPEC.md) - 繰り返しタスク詳細仕様
- [RECURRING_TASK_MANAGEMENT.md](./RECURRING_TASK_MANAGEMENT.md) - 繰り返しタスク実装アプローチ
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - アーキテクチャ（作成予定）

---

## 📝 備考

### 技術選択理由

**バッチ削除:**
- アプリ起動時チェックで十分（Tauriアプリは頻繁に起動される）
- バックグラウンドサービス不要で実装シンプル

**デスクトップ通知:**
- Tauri標準APIで実装容易
- クロスプラットフォーム対応

**ダークモード:**
- Tailwind CSS標準機能活用
- システムテーマ連動でUX向上
- 目の負担軽減

### リスク管理

**リスク1: 通知許可の拒否**
- 対策: 設定画面で明確な説明と利点を提示
- フォールバック: アプリ内通知（トースト）

**リスク2: ダークモードでのカラーコントラスト不足**
- 対策: 各色を事前にWCAG基準で検証
- ツール: contrast-ratio.com使用

**リスク3: バッチ削除のパフォーマンス影響**
- 対策: 削除対象が多い場合は分割実行
- モニタリング: 実行時間のログ出力
