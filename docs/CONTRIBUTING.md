# コントリビューションガイド

Kanban Board へのコントリビューションに興味を持っていただき、ありがとうございます！

このガイドでは、プロジェクトへの貢献方法を説明します。

## 目次

- [行動規範](#行動規範)
- [始め方](#始め方)
- [開発フロー](#開発フロー)
- [コーディング規約](#コーディング規約)
- [テスト](#テスト)
- [コミットメッセージ](#コミットメッセージ)
- [プルリクエスト](#プルリクエスト)

---

## 行動規範

このプロジェクトは、すべての参加者に対して敬意を払い、包括的な環境を提供することを約束します。

### 期待される行動

- 他の参加者に対して敬意を払う
- 建設的なフィードバックを提供する
- 異なる視点や経験を尊重する
- プロジェクトの利益を最優先する

### 許容されない行動

- 嫌がらせ、差別、攻撃的な言動
- 個人情報の無断公開
- その他、プロフェッショナルな環境で不適切とされる行為

---

## 始め方

### 必要な環境

- Node.js 18.x 以降
- npm 9.x 以降
- Rust 1.70 以降（デスクトップアプリのビルドに必要）
- Git

### リポジトリのセットアップ

1. **リポジトリをフォーク**
   ```bash
   # GitHub 上でリポジトリをフォーク
   ```

2. **ローカルにクローン**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Kanban-tauri.git
   cd kanban-rust
   ```

3. **依存関係をインストール**
   ```bash
   npm install
   ```

4. **開発サーバーを起動**
   ```bash
   # Tauri アプリとして起動
   npm run tauri dev

   # または、ブラウザ版として起動
   npm run dev
   ```

5. **アップストリームを追加**
   ```bash
   git remote add upstream https://github.com/yosuke1114/Kanban-tauri.git
   ```

---

## 開発フロー

### ブランチ戦略

- **master**: 安定版ブランチ
- **feature/xxx**: 新機能開発
- **fix/xxx**: バグ修正
- **refactor/xxx**: リファクタリング
- **docs/xxx**: ドキュメント更新

### ワークフロー

1. **最新のコードを取得**
   ```bash
   git checkout master
   git pull upstream master
   ```

2. **フィーチャーブランチを作成**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

3. **開発**
   - コードを書く
   - テストを追加・更新
   - ドキュメントを更新

4. **変更をコミット**
   ```bash
   git add .
   git commit -m "feat: Add awesome feature"
   ```

5. **プッシュ**
   ```bash
   git push origin feature/my-awesome-feature
   ```

6. **プルリクエストを作成**
   - GitHub 上でプルリクエストを作成
   - テンプレートに従って記入

---

## コーディング規約

### TypeScript / JavaScript

#### 基本ルール

- **TypeScript strict mode** を有効化
- **ESLint** ルールに従う
- **Prettier** でコードフォーマット（推奨）

#### スタイルガイド

```typescript
// ✅ Good
interface TaskProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

const TaskCard: React.FC<TaskProps> = ({ task, onUpdate }) => {
  const handleClick = useCallback(() => {
    onUpdate(task);
  }, [task, onUpdate]);

  return <Card onClick={handleClick}>{task.title}</Card>;
};

// ❌ Bad
const TaskCard = (props: any) => {
  return <Card onClick={() => props.onUpdate(props.task)}>{props.task.title}</Card>;
};
```

#### 命名規則

- **コンポーネント**: PascalCase (`TaskCard.tsx`)
- **フック**: camelCase with `use` prefix (`useFilteredTasks.ts`)
- **ユーティリティ**: camelCase (`formatDate.ts`)
- **定数**: UPPER_SNAKE_CASE (`MAX_TASK_TITLE_LENGTH`)
- **型**: PascalCase (`Task`, `Priority`)

#### インポート順序

```typescript
// 1. React
import React, { useState, useCallback } from "react";

// 2. 外部ライブラリ
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// 3. 内部モジュール（@/ エイリアス使用）
import { useBoardStore } from "@/stores/useBoardStore";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
```

### React ベストプラクティス

#### 1. コンポーネントのメモ化

```typescript
// 再レンダリングを防ぐ
export const TaskCard = React.memo(({ task, onClick }) => {
  return <Card onClick={onClick}>{task.title}</Card>;
});

TaskCard.displayName = "TaskCard";
```

#### 2. useCallback / useMemo の適切な使用

```typescript
// コールバック関数のメモ化
const handleClick = useCallback(() => {
  updateTask(taskId, newData);
}, [taskId, newData, updateTask]);

// 計算結果のメモ化
const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => a.priority - b.priority);
}, [tasks]);
```

#### 3. カスタムフックの使用

```typescript
// ロジックを再利用可能にする
export function useFilteredTasks() {
  const tasks = useBoardStore(selectTasks);
  const filters = useBoardStore((state) => state.filters);

  return useMemo(() => {
    return Object.values(tasks).filter(/* ... */);
  }, [tasks, filters]);
}
```

### Zustand ストアのベストプラクティス

#### ❌ 危険なパターン

```typescript
// セレクター内で関数を呼び出す → 無限ループの原因
const data = useStore((state) => state.getData());
```

#### ✅ 安全なパターン

```typescript
// 方法1: 状態を直接購読
const tasks = useStore((state) => state.tasks);

// 方法2: useMemo でメモ化
const tasks = useStore((state) => state.tasks);
const filteredTasks = useMemo(() => filterTasks(tasks), [tasks]);
```

### CSS / Tailwind

- **Tailwind CSS** のユーティリティクラスを使用
- **カスタム CSS** は最小限に
- **レスポンシブデザイン**: モバイルファースト

```tsx
<div className="flex flex-col gap-2 md:flex-row md:gap-4">
  {/* モバイル: 縦並び、デスクトップ: 横並び */}
</div>
```

---

## テスト

### テスト戦略

すべてのコード変更には適切なテストが必要です。

#### ユニットテスト (Vitest)

```bash
# テスト実行
npm run test

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch
```

**テストファイル命名規則**:
- コンポーネント: `ComponentName.test.tsx`
- フック: `useHookName.test.ts`
- ユーティリティ: `utilityName.test.ts`

**テストの書き方**:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  it("タスクのタイトルが表示される", () => {
    const task = {
      id: "1",
      title: "テストタスク",
      // ...
    };

    render(<TaskCard task={task} />);
    expect(screen.getByText("テストタスク")).toBeInTheDocument();
  });
});
```

#### E2E テスト (Playwright)

```bash
# E2E テスト実行
npm run test:e2e

# ヘッドレスモードで実行
npm run test:e2e:headless
```

### テストカバレッジ目標

- **ユニットテスト**: 70% 以上
- **E2E テスト**: 主要なユーザーフロー

### 品質確認チェックリスト

すべてのプルリクエスト前に以下を確認:

- [ ] `npm run build` が成功する
- [ ] `npm run test -- --run` が全てパスする
- [ ] `npm run test:e2e` が全てパスする
- [ ] ESLint エラーがない (`npm run lint`)
- [ ] 型エラーがない (`tsc --noEmit`)
- [ ] ブラウザコンソールにエラーがない
- [ ] 変更した機能が正常に動作する

---

## コミットメッセージ

### Conventional Commits

このプロジェクトは [Conventional Commits](https://www.conventionalcommits.org/) に従います。

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの意味に影響しない変更（空白、フォーマット等）
- **refactor**: バグ修正も機能追加もしないコード変更
- **perf**: パフォーマンス改善
- **test**: テストの追加・修正
- **chore**: ビルドプロセスやツールの変更

### Scope（オプション）

- `task`: タスク関連
- `board`: ボード関連
- `filter`: フィルター関連
- `ui`: UI コンポーネント

### 例

```
feat(task): サブタスクの進捗表示機能を追加

- サブタスクの完了数を表示
- 進捗バーを追加
- 完了率を計算

Closes #123
```

```
fix(filter): タグフィルターが正しく動作しない問題を修正

複数のタグが選択されている場合に、OR条件ではなくAND条件で
フィルタリングされていた問題を修正。

Fixes #456
```

---

## プルリクエスト

### プルリクエストの作成

1. **タイトル**: 簡潔で分かりやすく
2. **説明**: 変更内容と理由を明確に
3. **関連 Issue**: `Closes #123` または `Fixes #456`
4. **スクリーンショット**: UI 変更の場合は必須

### プルリクエストテンプレート

```markdown
## 変更内容

<!-- 変更内容を簡潔に説明 -->

## 変更理由

<!-- なぜこの変更が必要か -->

## 関連 Issue

Closes #

## 変更の種類

- [ ] バグ修正
- [ ] 新機能
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] その他（説明: ）

## テスト

- [ ] ユニットテストを追加・更新
- [ ] E2E テストを追加・更新
- [ ] 手動テストを実施

## チェックリスト

- [ ] コードがコーディング規約に従っている
- [ ] 全てのテストがパスする
- [ ] ドキュメントを更新した（必要な場合）
- [ ] CHANGELOG.md を更新した（必要な場合）

## スクリーンショット（UI 変更の場合）

<!-- ビフォー/アフターのスクリーンショットを追加 -->
```

### レビュープロセス

1. **自己レビュー**: プルリクエスト作成前に自分でコードを確認
2. **自動チェック**: CI が自動的にテストとビルドを実行
3. **コードレビュー**: メンテナーがレビュー
4. **修正対応**: フィードバックに基づいて修正
5. **マージ**: 承認後、メンテナーがマージ

### レビューガイドライン

#### レビュアー

- 建設的なフィードバックを提供
- 具体的な改善案を提示
- 良いコードは積極的に褒める

#### レビュイー

- フィードバックを前向きに受け止める
- 不明点は質問する
- 修正後は再レビューを依頼

---

## ドキュメント

コード変更に伴い、以下のドキュメントも更新してください:

- **README.md**: 機能追加、使用方法の変更
- **CLAUDE.md**: アーキテクチャ、実装パターンの変更
- **docs/**: 詳細なドキュメント
- **CHANGELOG.md**: リリース時の変更履歴

---

## ヘルプが必要な場合

- [GitHub Issues](https://github.com/yosuke1114/Kanban-tauri/issues) で質問
- [GitHub Discussions](https://github.com/yosuke1114/Kanban-tauri/discussions) でディスカッション

---

## ライセンス

コントリビューションは MIT ライセンスの下で公開されます。

---

## 謝辞

コントリビューションに感謝します！あなたの貢献がプロジェクトをより良いものにします。
