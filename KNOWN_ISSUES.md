# 既知の課題

**作成日**: 2026-02-02

このファイルは、開発中に発見された既知の課題と技術的負債を記録します。

---

## 🔴 Critical（優先度：高）

### マルチボード対応への移行が不完全

**発見日**: 2026-02-02
**影響範囲**: 通知機能
**症状**: 通知フック（`useDueDateNotifications`）が古いストア構造を参照していたため、タスクが取得できず通知が動作しなかった

**詳細**:
- マルチボード対応でストア構造が変更（`state.tasks` → `state.boards[state.currentBoardId].tasks`）
- `src/hooks/useDueDateNotifications.ts` が旧構造（`state.tasks`）を参照していた
- 結果として `Object.values(tasks)` が空配列となり、通知条件を満たさなかった

**修正内容**:
```typescript
// 修正前（❌ 動作しない）
const tasks = useBoardStore((state) => state.tasks);

// 修正後（✅ 正常動作）
const tasks = useBoardStore((state) => state.boards[state.currentBoardId].tasks);
```

**横展開調査結果**:
- ✅ `src/App.tsx`: 正しい構造を使用（`state.boards[state.currentBoardId]?.tasks`）
- ✅ 他のコンポーネント: 問題なし
- ❌ `src/hooks/useDueDateNotifications.test.ts`: テストのモックも古い構造 → 修正済み

**再発防止策**:
1. ✅ テストモックを正しいストア構造に更新
   - マルチボード構造（`boards[currentBoardId].tasks`）を使用
   - テスト実行時に型エラーで検出できるようになった

2. 📝 開発ガイドラインに追加
   ```typescript
   // ❌ 古い構造（非推奨）
   const tasks = useBoardStore((state) => state.tasks);

   // ✅ 正しい構造（推奨）
   const tasks = useBoardStore((state) => state.boards[state.currentBoardId].tasks);

   // ✅ Null安全（推奨）
   const tasks = useBoardStore((state) => state.boards[state.currentBoardId]?.tasks || {});
   ```

3. 🔍 コードレビューチェックリスト
   - [ ] Zustandストアアクセス時は必ず `state.boards[state.currentBoardId]` を使用
   - [ ] テストモックは実際のストア構造と一致させる
   - [ ] 新規フック作成時は既存のパターンを参照

4. 🧪 テストカバレッジ
   - [ ] 各フックでストア構造の正しさを検証するテストを追加
   - [ ] E2Eテストで通知機能の動作を確認

**関連ファイル**:
- `src/hooks/useDueDateNotifications.ts` (修正済み)
- `src/hooks/useDueDateNotifications.test.ts` (修正済み)

---

## 🟡 Medium（優先度：中）

### Tauri v1開発モードで通知が表示されない

**発見日**: 2026-02-03
**影響範囲**: デスクトップ通知機能
**症状**: `npm run tauri dev` で起動したアプリでは、通知APIは正常に動作するが、macOSの通知センターに通知が表示されない

**詳細**:
- Tauri v1の開発モードでは、アプリがmacOSに正式登録されないため、通知システムに認識されない
- `isPermissionGranted()` は `true` を返すが、実際には通知が表示されない
- システム設定 → 通知にアプリが表示されない

**回避策**:
1. **プロダクションビルドを使用**（推奨）
   ```bash
   npm run tauri build
   open "src-tauri/target/release/bundle/macos/Kanban Board.app"
   ```
   - 初回起動時に通知権限ダイアログが表示される
   - システム設定に「Kanban Board」として登録される

2. **開発時の動作確認**
   - 通知ロジックはユニットテストで検証
   - UIテストはプロダクションビルドで実施

**将来の対応**:
- Tauri v2へのアップグレードで改善される可能性あり（v2では通知システムが改善されている）

**関連ファイル**:
- `src/hooks/useDueDateNotifications.ts`
- `src/services/notification/notificationService.ts`
- `src-tauri/tauri.conf.json` (notification allowlist設定)

---

（今後発見された課題をここに追加）

---

## 🟢 Low（優先度：低）

（今後発見された課題をここに追加）

---

## ✅ 解決済み

（解決した課題を移動）
