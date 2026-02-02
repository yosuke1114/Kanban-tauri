import { test, expect } from '@playwright/test';

test.describe('ボード管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('新しいボードを作成できる', async ({ page }) => {
    // ボードセレクターをクリック
    await page.getByRole('button', { name: /テストボード|ボード/i }).first().click();

    // 「新規ボード作成」ボタンをクリック
    await page.getByRole('button', { name: /新規ボード作成/i }).click();

    // ボード名入力ダイアログ
    const nameInput = page.getByLabel(/ボード名/i);
    await nameInput.fill('新しいプロジェクト');

    // 説明を入力（オプション）
    const descInput = page.getByLabel(/説明/i);
    await descInput.fill('テスト用のプロジェクトボード');

    // 作成ボタンをクリック
    await page.getByRole('button', { name: /作成|保存/i }).click();

    // 新しいボードに切り替わったことを確認
    await expect(page.getByRole('button').filter({ hasText: '新しいプロジェクト' })).toBeVisible();
  });

  test('ボードを切り替えできる', async ({ page }) => {
    // 新しいボードを作成
    await page.getByRole('button', { name: /テストボード|ボード/i }).first().click();
    await page.getByRole('button', { name: /新規ボード作成/i }).click();
    await page.getByLabel(/ボード名/i).fill('ボード2');
    await page.getByRole('button', { name: /作成|保存/i }).click();

    // 元のボードに戻る
    await page.getByRole('button', { name: /ボード2/i }).first().click();
    await page.getByRole('option', { name: /テストボード/i }).click();

    // 元のボードに切り替わったことを確認
    await expect(page.getByRole('button').filter({ hasText: 'テストボード' })).toBeVisible();
  });

  test('ボードごとに独立したタスクを持つ', async ({ page }) => {
    // ボード1にタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('ボード1のタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクカード内に表示されることを確認（トースト通知は除外）
    await expect(page.locator('[data-task-card]').getByText('ボード1のタスク')).toBeVisible();

    // 新しいボードを作成して切り替え
    await page.getByRole('button', { name: /テストボード|ボード/i }).first().click();
    await page.getByRole('button', { name: /新規ボード作成/i }).click();
    await page.getByLabel(/ボード名/i).fill('ボード2');
    await page.getByRole('button', { name: /作成|保存/i }).click();

    // ボード2ではボード1のタスクが表示されないことを確認
    await expect(page.locator('[data-task-card]').getByText('ボード1のタスク')).not.toBeVisible();

    // ボード2にタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('ボード2のタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();
    await expect(page.locator('[data-task-card]').getByText('ボード2のタスク')).toBeVisible();

    // ボード1に戻る
    await page.getByRole('button', { name: /ボード2/i }).first().click();
    await page.getByRole('option', { name: /テストボード/i }).click();

    // ボード1のタスクのみが表示されることを確認
    await expect(page.locator('[data-task-card]').getByText('ボード1のタスク')).toBeVisible();
    await expect(page.locator('[data-task-card]').getByText('ボード2のタスク')).not.toBeVisible();
  });

  test('ビューを切り替えできる（カンバン/リスト/カレンダー）', async ({ page }) => {
    // カンバンビュー（デフォルト）
    await expect(page.getByRole('tab', { name: /カンバンビュー/i })).toHaveAttribute('data-state', 'active');

    // リストビューに切り替え
    await page.getByRole('tab', { name: /リストビュー/i }).click();
    await expect(page.getByRole('tab', { name: /リストビュー/i })).toHaveAttribute('data-state', 'active');

    // テーブルが表示されることを確認
    await expect(page.getByRole('table')).toBeVisible();

    // カレンダービューに切り替え
    await page.getByRole('tab', { name: /カレンダービュー/i }).click();
    await expect(page.getByRole('tab', { name: /カレンダービュー/i })).toHaveAttribute('data-state', 'active');

    // カレンダーが表示されることを確認
    // Note: DayPickerの構造に依存
  });

  test('カラムを追加・編集・削除できる', async ({ page }) => {
    // 管理メニューを開く（Settingsアイコン付きの方を選択）
    await page.getByRole('button', { name: '管理', exact: true }).click();

    // 列管理をクリック
    await page.getByTestId('open-column-manager').click();

    // 列管理ダイアログが開くことを確認
    await expect(page.getByRole('dialog')).toBeVisible();

    // 新しいカラムを追加
    const columnNameInput = page.getByPlaceholder(/列名を入力/i);
    await columnNameInput.fill('レビュー中');

    // カラーを選択（最初のカラーオプションをクリック）
    await page.getByTestId(/color-option-/).first().click();

    // 追加ボタンをクリック
    await page.getByRole('button', { name: /追加/i }).click();

    // 新しいカラムが追加されたことを確認
    await expect(page.getByText('レビュー中')).toBeVisible();

    // ダイアログを閉じる
    await page.getByRole('button', { name: /閉じる/i }).click();

    // カンバンボードに新しいカラムが表示されることを確認
    await expect(page.getByRole('heading', { name: /レビュー中/i })).toBeVisible();
  });
});
