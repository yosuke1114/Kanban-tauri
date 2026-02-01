# 次期開発計画（2026年2月〜3月）

**作成日**: 2026-02-01
**前回コミット**: feat: レスポンシブ対応と入力バリデーションを実装
**テスト状況**: 324テスト全パス

---

## 📊 現状の進捗状況

### ✅ 完了済み機能（直近2週間）

| 機能 | 完了日 | コミット |
|------|--------|---------|
| Week 3-4機能（カレンダー、サブタスク、D&D改善） | 2026-01-31 | b3e34e8 |
| Phase 4.4: レスポンシブデザイン最適化 | 2026-01-30 | 40977f4 |
| Phase 4.3: キーボードショートカット拡張 | 2026-01-29 | 467ee75 |
| Phase 3.0.3: レスポンシブ対応完成 | 2026-01-28 | 7094784 |
| 入力バリデーションシステム | 2026-02-01 | 4bf3b41 |
| Slackスタイルテーマ | 2026-02-01 | 501bd03 |
| マルチボード機能 | 2026-01-20 | 1107fe1 |
| ソフト削除・アーカイブ | 2026-01-18 | 92dd45d |
| フィルターUI | - | 実装済み |
| リストビュー | - | 実装済み |

### ⏳ 未完了の重要機能

#### Phase 3.0 残タスク（緊急）
- [ ] **列の並べ替え機能**（GripVerticalアイコンあるが動作しない）
- [ ] **タイトル重複解消**（App.tsx と KanbanBoard.tsx で重複）

#### Phase 3 残タスク
- [ ] **デスクトップ通知機能**（Tauri API使用）
- [ ] **日付範囲フィルター**（react-day-pickerインストール済み）

#### リファクタリング（技術的負債）
- [ ] **共通定数の抽出**（優先度、カラー、期限日）
- [ ] **共有コンポーネントの作成**（削除確認ダイアログ、カラーピッカー）
- [ ] **パフォーマンス最適化**（React.memo、useCallback、メモ化）

#### Phase 4 残タスク
- [ ] **アクセシビリティ改善**（WCAG 2.1 AA準拠）
- [ ] **ダークモード対応**
- [ ] **コンテキストメニュー改善**

---

## 🎯 Phase 5.0: 技術的負債解消とコード品質向上（最優先）

**期間**: 2週間（2/1 - 2/14）
**目的**: 安定性とメンテナンス性の向上、パフォーマンス改善

**実装状況サマリー**: 21/25機能完了（84%）
詳細は `IMPLEMENTATION_STATUS.md` 参照

---

### Phase 5.0.1: 緊急修正（即座に対応）

#### 1. タイトル重複の解消 ⭐ 最優先
**見積もり**: 1時間
**優先度**: 🔴 最高

**現状問題**:
- App.tsxヘッダーとKanbanBoard.tsx両方に「Kanban Board」が表示
- UIが冗長

**実装内容**:
- KanbanBoard.tsx内のタイトルセクションを削除
- ヘッダーレイアウト確認

**影響範囲**: `src/components/kanban/KanbanBoard.tsx`

**完了基準**:
- ✅ タイトル重複がない
- ✅ クリーンなUI
- ✅ 既存のテストが成功

---

### Phase 5.0.2: リファクタリング実装（1週間）

> 詳細計画は `/Users/yo_kuro/.claude/plans/steady-petting-parnas.md` を参照

#### 1. 共通定数の抽出
**見積もり**: 6-8時間

**新規ファイル**:
- `src/constants/priority.ts` - 優先度定数（5箇所から統合）
- `src/constants/colors.ts` - カラー定数（3箇所から統合）
- `src/utils/dueDate.ts` - 期限日ユーティリティ（2箇所から抽出）
- `src/utils/dueDate.test.ts` - 期限日テスト

**影響範囲**: 10ファイル

---

#### 2. 共有コンポーネントの作成
**見積もり**: 8-10時間

**新規ファイル**:
- `src/components/shared/DeleteConfirmationDialog.tsx` - 削除確認ダイアログ（5箇所から統合）
- `src/components/shared/DeleteConfirmationDialog.test.tsx`
- `src/components/shared/ColorPicker.tsx` - カラーピッカー（3箇所から統合）
- `src/components/shared/ColorPicker.test.tsx`

**影響範囲**: 8ファイル

---

#### 3. パフォーマンス最適化（高優先度）
**見積もり**: 6-8時間

**修正内容**:

**3.1 SortableTaskCard に React.memo 追加**
```typescript
// src/components/task/SortableTaskCard.tsx
export const SortableTaskCard = React.memo(({ task, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(task);
  }, [task, onClick]);
  // ...
});
```

**3.2 KanbanBoard の columnTasks をメモ化**
```typescript
// src/components/kanban/KanbanBoard.tsx
const tasksByColumn = useMemo(() => {
  const grouped: Record<string, Task[]> = {};
  columnOrder.forEach(columnId => {
    grouped[columnId] = filteredTasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  });
  return grouped;
}, [filteredTasks, columnOrder]);
```

**3.3 useCallback追加**
- FilterPanel: toggleTag, toggleAssignee, togglePriority
- MemberManager: handleAddMember, handleToggleActive
- TagManager: handleAddTag, handleDeleteTag
- CalendarView: handleDayClick, handleTaskClick

---

### Phase 5.0.3: テスト強化
**見積もり**: 4-6時間

**実装内容**:
- ColumnManager のドラッグ&ドロップテスト
- 新規ユーティリティ関数のテスト
- 共有コンポーネントのテスト

**目標カバレッジ**: 67%以上維持

---

## 🚀 Phase 5.1: 機能拡張（2週間）

**期間**: 2/8 - 2/28

### 5.1.1 「自分のタスク」クイックフィルター
**見積もり**: 3時間
**優先度**: 🟡 高

**実装内容**:
- AppHeaderに「自分のタスク」トグルボタン追加
- ユーザー選択UI追加
- トグルONで自分がアサインされたタスクのみ表示
- 設定をlocalStorageに保存

**新規ファイル**: なし（既存コンポーネントに追加）

---

### 5.1.2 デスクトップ通知機能
**見積もり**: 6-7時間
**優先度**: 🟡 高

**実装内容**:

**新規ファイル**:
- `src/services/notification/desktopNotificationService.ts`
- `src/services/notification/desktopNotificationService.test.ts`
- `src/components/settings/NotificationSettings.tsx`

**機能**:
- 期限切れタスクの通知
- 期限が近いタスクの通知（1日前、1時間前）
- 通知のクリックでタスクにジャンプ
- 通知設定UI

**実装方針**:
```typescript
// Tauri環境ではTauri Notification API使用
// Web環境ではブラウザNotification API使用
if (window.__TAURI__) {
  await sendNotification({ title, body });
} else {
  new Notification(title, { body });
}
```

---

### 5.1.3 日付範囲フィルター
**見積もり**: 4-5時間
**優先度**: 🟡 高

**実装内容**:

**新規ファイル**:
- `src/components/ui/date-range-picker.tsx`

**実装内容**:
- react-day-pickerをラップしたコンポーネント
- 日本語ロケール対応
- 範囲選択モード
- Apple風スタイリング

**統合先**: `src/components/filter/FilterPanel.tsx`

---

### 5.1.4 ダークモード対応
**見積もり**: 5-6時間
**優先度**: 🟢 中

**新規ファイル**:
- `src/hooks/useTheme.ts`
- `src/components/ThemeToggle.tsx`

**実装内容**:
- Tailwind CSS dark mode設定
- システム設定に従う（prefers-color-scheme）
- 手動切り替えトグル
- すべてのコンポーネントをダークモード対応

---

## 📅 実装スケジュール

### Week 1（2/1 - 2/7）
| 日 | タスク | 見積もり | 状態 |
|----|--------|---------|------|
| 2/1 | 開発計画作成、ドキュメント更新 | 2h | ✅ 完了 |
| 2/2 | タイトル重複解消 | 1h | ⏳ 次 |
| 2/3-4 | 共通定数の抽出 | 6h | ⏳ |
| 2/5-6 | 共有コンポーネント作成 | 8h | ⏳ |

**合計**: 17時間
**完了**: 2時間（12%）

---

### Week 2（2/8 - 2/14）
| 日 | タスク | 見積もり | 状態 |
|----|--------|---------|------|
| 2/8-9 | パフォーマンス最適化 | 6h | ⏳ |
| 2/10 | 「自分のタスク」フィルター | 3h | ⏳ |
| 2/11-12 | 日付範囲フィルター | 4h | ⏳ |
| 2/13-14 | デスクトップ通知機能 | 7h | ⏳ |

**合計**: 20時間

---

### Week 3-4（2/15 - 2/28）
| 日 | タスク | 見積もり |
|----|--------|---------|
| 2/15-16 | ダークモード対応 | 6h |
| 2/17-20 | アクセシビリティ改善 | 10h |
| 2/21-24 | E2Eテスト追加 | 10h |
| 2/25-28 | ドキュメント整備、リリース準備 | 8h |

**合計**: 34時間

---

## ✅ 品質基準（各タスク完了後）

### 必須チェック
- [ ] `npm run build` 成功
- [ ] `npm run test -- --run` 全テスト成功（324+新規テスト）
- [ ] `npm run test:e2e` 全E2Eテスト成功
- [ ] 画面表示確認（白い画面でない）
- [ ] コンソールエラーなし
- [ ] React Best Practiceレビュー実施（Vercelスキル）

### カバレッジ基準
- **Statements**: 67%以上維持
- **Branches**: 67%以上維持
- **Functions**: 67%以上維持
- **Lines**: 67%以上維持

### パフォーマンス基準
- **Lighthouse Performance**: 90+
- **Lighthouse Accessibility**: 95+
- **バンドルサイズ**: 600KB以下（gzip）
- **初期ロード**: 2秒以内

---

## 🔮 Phase 6以降の展望（3月〜）

### Phase 6: SharePoint連携（3月）
- Microsoft Graph API認証
- 手動同期機能
- データ競合解決

**見積もり**: 35-42時間

---

### Phase 7: 統計・分析機能（4月）
- ダッシュボード
- 完了率レポート
- CSVエクスポート

**見積もり**: 20-25時間

---

## 📊 成功指標（Phase 5完了時）

### 技術指標
- **テストカバレッジ**: 67%以上
- **Lighthouse Performance**: 90+
- **Lighthouse Accessibility**: 95+
- **バンドルサイズ**: 550KB以下
- **重複コード**: 5%以下

### コード品質
- **重複定数**: 0件
- **重複コンポーネント**: 0件
- **未使用import**: 0件
- **TypeScriptエラー**: 0件

### ユーザー体験
- **タスク操作レスポンス**: 50ms以内
- **列の並べ替え**: スムーズな動作
- **通知**: 確実に届く
- **ダークモード**: 全画面対応

---

## 🎯 次のアクション

### 今日（2/1）
1. ✅ この開発計画ドキュメント作成
2. ⏳ CLAUDE.md 更新
3. ⏳ 列の並べ替え機能実装開始

### 明日（2/2）
1. ⏳ 列の並べ替え機能完了
2. ⏳ タイトル重複解消
3. ⏳ コミット、プッシュ、CI確認

### 今週末（2/7）
1. ⏳ Phase 5.0.2 完了（リファクタリング）
2. ⏳ 週次レビュー実施

---

## 📝 関連ドキュメント

- **長期ロードマップ**: `/Users/yo_kuro/kanban-rust/LONGTERM_ROADMAP.md`
- **Phase 3計画**: `/Users/yo_kuro/kanban-rust/PHASE3_PLAN.md`
- **Phase 4計画**: `/Users/yo_kuro/kanban-rust/PHASE4_PLAN.md`
- **改善提案**: `/Users/yo_kuro/kanban-rust/IMPROVEMENT_PROPOSALS.md`
- **テスト戦略**: `/Users/yo_kuro/kanban-rust/TESTING_STRATEGY.md`
- **リファクタリング詳細**: `/Users/yo_kuro/.claude/plans/steady-petting-parnas.md`
- **プロジェクト説明**: `/Users/yo_kuro/kanban-rust/CLAUDE.md`

---

**作成者**: Claude Sonnet 4.5
**最終更新**: 2026-02-01
**次回レビュー**: 2026-02-07（Week 1完了後）
