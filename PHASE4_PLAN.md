# Phase 4: Apple風UI洗練 - 詳細実装計画

## 概要

Phase 3.0の機能実装完了を受けて、アプリケーション全体のUIをAppleのデザイン哲学に沿って洗練させます。
macOS/iOS風の直感的で美しいUIを実現し、ユーザー体験を大幅に向上させます。

---

## Phase 4.1: デザインシステムの確立

### 目的
統一されたデザイン言語とコンポーネントライブラリの基盤を構築

### 実装内容

#### 4.1.1 カラーパレットの最適化

**現状分析:**
- 既存のカスタムカラースキーム（`app/globals.css`）が存在
- Apple風の洗練度に欠ける部分がある

**改善方針:**
```css
/* app/globals.css に追加 */

:root {
  /* Primary - より深みのあるブルー（macOS Big Sur風） */
  --primary: 211 100% 50%;
  --primary-foreground: 0 0% 100%;

  /* Background - より明るく柔らかいグレー */
  --background: 0 0% 98%;
  --foreground: 240 10% 4%;

  /* Card - わずかな透明感 */
  --card: 0 0% 100%;
  --card-foreground: 240 10% 4%;

  /* Muted - Apple風の柔らかいグレー */
  --muted: 240 5% 96%;
  --muted-foreground: 240 4% 46%;

  /* Accent - Teal（Apple標準色） */
  --accent: 175 70% 41%;
  --accent-foreground: 0 0% 100%;

  /* Border - より繊細な境界線 */
  --border: 240 6% 90%;

  /* Apple風シャドウ */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.18);
}

.dark {
  /* Dark Mode - macOS風 */
  --background: 240 10% 8%;
  --foreground: 0 0% 95%;
  --card: 240 10% 12%;
  --muted: 240 4% 16%;
  --glass-bg: rgba(30, 30, 30, 0.7);
}
```

#### 4.1.2 タイポグラフィの改善

**方針:**
- San Francisco風のフォントスタック
- 適切な文字間隔と行間

```css
/* Tailwind config または globals.css */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.011em; /* Apple標準 */
}

/* 見出し */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600; /* Semibold */
  letter-spacing: -0.022em;
}
```

#### 4.1.3 アニメーション設定

**Apple風のイージング関数:**

```css
:root {
  /* Apple標準イージング */
  --ease-in-out-cubic: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* トランジション */
.transition-apple {
  transition-timing-function: var(--ease-in-out-cubic);
  transition-duration: 200ms;
}

.transition-apple-slow {
  transition-timing-function: var(--ease-out-expo);
  transition-duration: 350ms;
}
```

---

## Phase 4.2: コンポーネントの洗練

### 4.2.1 タスクカードの改善

**目標:**
- iOS Remindersアプリ風のカードデザイン
- ホバー時のインタラクション強化
- 視覚的階層の改善

**修正ファイル: `src/components/task/TaskCard.tsx`**

**変更内容:**
```tsx
// より洗練されたカードスタイル
className="
  group
  bg-card
  rounded-xl
  border border-border
  shadow-sm
  hover:shadow-md
  transition-all
  duration-200
  ease-out
  hover:-translate-y-0.5
  cursor-pointer
  overflow-hidden
  backdrop-blur-sm
  bg-opacity-95
"

// タイトルスタイル
className="
  font-semibold
  text-base
  leading-tight
  text-foreground
  group-hover:text-primary
  transition-colors
"

// 優先度バッジの改善
<Badge className="
  px-2 py-0.5
  text-xs
  font-medium
  rounded-full
  shadow-sm
"/>
```

#### 4.2.2 ヘッダーの洗練

**目標:**
- macOS Big Surのツールバー風デザイン
- ブラー効果（Glassmorphism）
- 固定ヘッダー対応

**修正ファイル: `src/App.tsx`**

**変更内容:**
```tsx
<header className="
  sticky top-0 z-50
  border-b border-border/40
  bg-card/70
  backdrop-blur-xl
  backdrop-saturate-150
  shadow-sm
  transition-all
  duration-200
">
  <div className="container mx-auto px-6 py-4">
    {/* グリッドレイアウトで整列 */}
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
      <h1 className="
        text-2xl
        font-semibold
        tracking-tight
        text-foreground
      ">
        Kanban Board
      </h1>

      {/* ボタングループ */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="
          rounded-lg
          hover:bg-muted
          transition-colors
          duration-150
        ">
          {/* ... */}
        </Button>
      </div>
    </div>

    {/* タスク追加フォーム */}
    <form className="mt-4">
      <Input className="
        bg-background/50
        border-border/50
        rounded-xl
        px-4 py-2.5
        focus:ring-2
        focus:ring-primary/20
        focus:border-primary
        transition-all
        duration-200
      " />
    </form>
  </div>
</header>
```

#### 4.2.3 カラムデザインの改善

**目標:**
- iOS 16のウィジェット風デザイン
- 適切な余白と角丸
- カラーインジケーターの洗練

**修正ファイル: `src/components/kanban/KanbanColumn.tsx`**

**変更内容:**
```tsx
<div className="
  flex-shrink-0
  w-full sm:w-80 md:w-96
  bg-muted/30
  backdrop-blur-sm
  rounded-2xl
  border border-border/50
  shadow-sm
  p-6
  snap-start
  transition-all
  duration-200
  hover:shadow-md
">
  {/* ヘッダー */}
  <div className="mb-5 flex items-center gap-3">
    <div
      className="w-1 h-6 rounded-full"
      style={{ backgroundColor: column.color }}
    />
    <h3 className="
      font-semibold
      text-lg
      tracking-tight
      text-foreground
    ">
      {column.title}
    </h3>
    <span className="
      ml-auto
      text-sm
      font-medium
      text-muted-foreground
      bg-muted
      px-2.5 py-1
      rounded-full
    ">
      {tasks.length}
    </span>
  </div>

  {/* タスクリスト */}
  <div className="space-y-3 min-h-[200px]">
    {/* ... */}
  </div>
</div>
```

#### 4.2.4 ダイアログの改善

**目標:**
- iOS/macOSのモーダル風デザイン
- スムーズなアニメーション
- アクセシビリティ向上

**修正ファイル:**
- `src/components/member/MemberManager.tsx`
- `src/components/tag/TagManager.tsx`
- `src/components/kanban/ColumnManager.tsx`
- `src/components/task/EditTaskDialog.tsx`

**共通スタイル:**
```tsx
<DialogContent className="
  sm:max-w-lg
  rounded-2xl
  border-border/50
  shadow-2xl
  backdrop-blur-xl
  bg-card/95
  p-0
  overflow-hidden
">
  <DialogHeader className="
    px-6 pt-6 pb-4
    border-b border-border/50
  ">
    <DialogTitle className="
      text-xl
      font-semibold
      tracking-tight
    ">
      {title}
    </DialogTitle>
  </DialogHeader>

  <div className="px-6 py-4">
    {/* コンテンツ */}
  </div>

  <DialogFooter className="
    px-6 pb-6 pt-4
    border-t border-border/50
    bg-muted/20
  ">
    {/* ボタン */}
  </DialogFooter>
</DialogContent>
```

---

## Phase 4.3: インタラクションの強化

### 4.3.1 コンテキストメニュー

**目標:**
- macOS風の右クリックメニュー
- タスクの素早い操作

**新規ファイル: `src/components/task/TaskContextMenu.tsx`**

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const TaskContextMenu = ({ task, children }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="
        w-56
        rounded-xl
        border-border/50
        shadow-lg
        backdrop-blur-xl
        bg-card/95
      ">
        <ContextMenuItem className="rounded-lg">
          編集
        </ContextMenuItem>
        <ContextMenuItem className="rounded-lg">
          複製
        </ContextMenuItem>
        <ContextMenuItem className="rounded-lg text-destructive">
          削除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
```

**統合先:**
- `SortableTaskCard.tsx`にコンテキストメニューをラップ

### 4.3.2 キーボードショートカット

**目標:**
- 効率的なキーボード操作
- macOS標準のショートカット準拠

**新規ファイル: `src/hooks/useKeyboardShortcuts.ts`**

```tsx
import { useEffect } from 'react';

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: クイック検索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // 検索フォーカス処理
      }

      // Cmd/Ctrl + N: 新規タスク
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // タスク追加フォームフォーカス
      }

      // Escape: モーダルを閉じる
      if (e.key === 'Escape') {
        // モーダルクローズ処理
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

**統合先:**
- `App.tsx`でフックを使用

### 4.3.3 ドラッグ&ドロップの視覚フィードバック強化

**修正ファイル: `src/components/task/SortableTaskCard.tsx`**

**変更内容:**
```tsx
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
  scale: isDragging ? 0.95 : 1,
  rotate: isDragging ? '2deg' : '0deg',
};

// ドラッグ中の視覚効果
className={cn(
  "transition-all duration-200",
  isDragging && "shadow-2xl ring-2 ring-primary/50"
)}
```

---

## Phase 4.4: レスポンシブデザインの最適化

### 4.4.1 タブレット対応の改善

**修正ファイル: `src/components/kanban/KanbanBoard.tsx`**

**変更内容:**
```tsx
// ブレークポイントの詳細化
const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

useEffect(() => {
  const updateViewport = () => {
    const width = window.innerWidth;
    if (width < 768) setViewportSize('mobile');
    else if (width < 1280) setViewportSize('tablet');
    else setViewportSize('desktop');
  };

  updateViewport();
  window.addEventListener('resize', updateViewport);
  return () => window.removeEventListener('resize', updateViewport);
}, []);

// タブレット: 2カラム表示
<div className={cn(
  "grid gap-4",
  viewportSize === 'mobile' && "grid-cols-1",
  viewportSize === 'tablet' && "grid-cols-2 overflow-x-auto",
  viewportSize === 'desktop' && "grid-cols-3 xl:grid-cols-4"
)}>
```

### 4.4.2 モバイルのジェスチャー対応

**新規機能:**
- スワイプでカラム切り替え
- プルトゥリフレッシュ

**実装方針:**
- `react-swipeable`または`use-gesture`の検討
- ネイティブアプリに近い操作感

---

## Phase 4.5: アクセシビリティとパフォーマンス

### 4.5.1 アクセシビリティの向上

**チェック項目:**
- [ ] ARIA属性の適切な使用
- [ ] キーボードナビゲーション完全対応
- [ ] スクリーンリーダー対応
- [ ] フォーカス管理の改善

**修正方針:**
```tsx
// フォーカストラップの実装
<Dialog>
  <DialogContent
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
    onOpenAutoFocus={(e) => {
      // 初期フォーカス制御
    }}
  >
    {/* ... */}
  </DialogContent>
</Dialog>

// キーボードナビゲーション
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

### 4.5.2 パフォーマンス最適化

**最適化項目:**
- [ ] 不要な再レンダリングの削減（既にuseMemoで対応済み）
- [ ] 仮想化（長いタスクリスト用）
- [ ] 遅延読み込み（画像、アイコン）
- [ ] バンドルサイズの削減

**実装方針:**
```tsx
// 仮想化（react-virtual）
import { useVirtualizer } from '@tanstack/react-virtual';

const TaskList = ({ tasks }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index} style={{ transform: `translateY(${virtualRow.start}px)` }}>
            <TaskCard task={tasks[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Phase 4.6: ダークモード対応

### 実装内容

**新規ファイル: `src/components/ThemeToggle.tsx`**

```tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-lg"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
};
```

**新規ファイル: `src/hooks/useTheme.ts`**

```tsx
import { useEffect, useState } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  return { theme, setTheme };
};
```

**統合先:**
- `App.tsx`のヘッダーにThemeToggleを追加

---

## 実装順序とスケジュール

| フェーズ | 内容 | 優先度 | 見積もり |
|---------|------|--------|---------|
| 4.1 | デザインシステム確立 | 最高 | 4-5時間 |
| 4.2 | コンポーネント洗練 | 高 | 6-8時間 |
| 4.3 | インタラクション強化 | 中 | 5-6時間 |
| 4.4 | レスポンシブ最適化 | 中 | 3-4時間 |
| 4.5 | A11y & パフォーマンス | 中 | 4-5時間 |
| 4.6 | ダークモード | 低 | 2-3時間 |
| **合計** | | | **24-31時間** |

---

## テスト計画

### ユニットテスト
- [ ] `useKeyboardShortcuts.test.ts`
- [ ] `useTheme.test.ts`
- [ ] `TaskContextMenu.test.tsx`

### E2Eテスト
- [ ] `e2e/accessibility.spec.ts` - A11y検証
- [ ] `e2e/keyboard-navigation.spec.ts` - キーボード操作
- [ ] `e2e/responsive.spec.ts` - レスポンシブ動作
- [ ] `e2e/dark-mode.spec.ts` - ダークモード切り替え

### ビジュアルリグレッションテスト
- [ ] Chromatic または Percy の導入検討
- [ ] スクリーンショット比較

---

## 成功指標

### デザイン品質
- [ ] Apple HIG（Human Interface Guidelines）準拠
- [ ] 統一されたデザイン言語
- [ ] 適切な余白とタイポグラフィ

### パフォーマンス
- [ ] Lighthouse スコア 90+
- [ ] 初回レンダリング時間 < 1秒
- [ ] インタラクション遅延 < 100ms

### アクセシビリティ
- [ ] WCAG 2.1 AA準拠
- [ ] キーボード操作100%対応
- [ ] スクリーンリーダー対応

### ユーザー体験
- [ ] 直感的な操作感
- [ ] スムーズなアニメーション
- [ ] エラーのないコンソール

---

## 参考資料

### デザインガイドライン
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [macOS Big Sur Design](https://developer.apple.com/design/human-interface-guidelines/macos)
- [iOS Design Themes](https://developer.apple.com/design/human-interface-guidelines/ios)

### 技術リファレンス
- [Tailwind CSS Glassmorphism](https://tailwindcss.com/docs/backdrop-blur)
- [Radix UI Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility)
- [Framer Motion](https://www.framer.com/motion/) - アニメーション

---

## 次のアクション

Phase 4.1から順番に実装を開始。各フェーズ完了後に：
1. ビルド確認
2. テスト実行
3. ビジュアル確認
4. React Best Practice レビュー
