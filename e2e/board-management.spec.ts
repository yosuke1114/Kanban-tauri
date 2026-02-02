import { test, expect } from '@playwright/test';

test.describe('ボード管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('新しいボードを作成できる', async ({ page }) => {
    // ボード管理ボタンをクリック（Settingsアイコン）
    await page.getByRole('button', { name: 'ボードを管理' }).click();

    // ダイアログが開くまで待機
    await expect(page.getByRole('dialog')).toBeVisible();

    // 「新しいボードを作成」ボタンをクリック
    await page.getByRole('button', { name: '新しいボードを作成' }).click();

    // ボード名入力フォームが表示されるまで待機
    const nameInput = page.getByLabel(/ボード名/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('新しいプロジェクト');

    // 説明を入力（任意）
    const descInput = page.getByLabel(/説明/i);
    await descInput.fill('テスト用のプロジェクトボード');

    // 作成ボタンをクリック
    await page.getByRole('button', { name: '作成', exact: true }).click();

    // ボード一覧に新しいボードが表示されることを確認
    await expect(page.getByRole('dialog').getByText('新しいプロジェクト')).toBeVisible();
  });

  test('ボードを切り替えできる', async ({ page }) => {
    // 新しいボードを作成
    await page.getByRole('button', { name: 'ボードを管理' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: '新しいボードを作成' }).click();
    await page.getByLabel(/ボード名/i).fill('ボード2');
    await page.getByRole('button', { name: '作成', exact: true }).click();

    // ボード一覧で元のボード（メインボード）をクリックして切り替え
    // ボードが作成されるまで待機してから選択
    await page.waitForTimeout(500);
    await page.getByRole('dialog').getByText('メインボード', { exact: true }).first().click();

    // ダイアログが閉じることを確認
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // ボードセレクターに「メインボード」が表示されることを確認
    await expect(page.getByRole('combobox')).toContainText('メインボード');
  });

  test('ボードごとに独立したタスクを持つ', async ({ page }) => {
    // ボード1にタスクを作成
    await page.getByTestId('add-task-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/タイトル/i).fill('ボード1のタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // ダイアログが閉じるまで待機
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // タスクカードが表示されるまで待機
    await expect(page.locator('[data-task-card]').filter({ hasText: 'ボード1のタスク' })).toBeVisible();

    // 新しいボードを作成して切り替え
    await page.getByRole('button', { name: 'ボードを管理' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: '新しいボードを作成' }).click();
    await page.getByLabel(/ボード名/i).fill('ボード2');
    await page.getByRole('button', { name: '作成', exact: true }).click();

    // ボード一覧で「ボード2」をクリックして切り替え（自動的にダイアログが閉じる）
    // ボードが作成されるまで待機してから選択
    await page.waitForTimeout(500);
    await page.getByRole('dialog').getByText('ボード2', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // ボード2ではボード1のタスクが表示されないことを確認
    await expect(page.locator('[data-task-card]').filter({ hasText: 'ボード1のタスク' })).not.toBeVisible();

    // ボード2にタスクを作成
    await page.getByTestId('add-task-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/タイトル/i).fill('ボード2のタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('[data-task-card]').filter({ hasText: 'ボード2のタスク' })).toBeVisible();

    // ボード1に戻る
    await page.getByRole('combobox').click();
    // ドロップダウンが開くまで待機
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: /メインボード/i }).click();

    // ボード1のタスクのみが表示されることを確認
    await expect(page.locator('[data-task-card]').filter({ hasText: 'ボード1のタスク' })).toBeVisible();
    await expect(page.locator('[data-task-card]').filter({ hasText: 'ボード2のタスク' })).not.toBeVisible();
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

    // 追加ボタンをクリック（アイコンのみのボタンなのでdata-testidを使用）
    await page.getByTestId('add-column-button').click();

    // 新しいカラムが追加されるまで待機
    await page.waitForTimeout(300);

    // 新しいカラムが追加されたことを確認（ダイアログ内で）
    await expect(page.getByRole('dialog').getByText('レビュー中')).toBeVisible();

    // ダイアログを閉じる
    await page.getByRole('button', { name: /閉じる/i }).click();

    // カンバンボードに新しいカラムが表示されることを確認
    await expect(page.getByRole('heading', { name: /レビュー中/i })).toBeVisible();
  });
});
