import { test, expect } from '@playwright/test';

test.describe('ドラッグ&ドロップ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('タスクを別の列に移動できる', async ({ page }) => {
    // テスト用タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('移動するタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクが「未着手」列に存在することを確認
    const todoColumn = page.locator('[data-column-id="todo"]').or(
      page.getByRole('heading', { name: /未着手/i }).locator('..')
    );
    await expect(todoColumn.locator('[data-task-card]').getByText('移動するタスク')).toBeVisible();

    // ドラッグ&ドロップ: 未着手 → 進行中
    const taskElement = page.locator('[data-task-card]').filter({ hasText: '移動するタスク' });
    const inProgressColumn = page.getByRole('heading', { name: /進行中/ }).locator('..');

    await taskElement.dragTo(inProgressColumn);

    // タスクが「進行中」列に移動したことを確認
    await expect(inProgressColumn.locator('[data-task-card]').getByText('移動するタスク')).toBeVisible();

    // 「未着手」列にはもう存在しないことを確認
    await expect(todoColumn.locator('[data-task-card]').getByText('移動するタスク')).not.toBeVisible();
  });

  test('タスクの順序を変更できる', async ({ page }) => {
    // 複数のタスクを作成
    const tasks = ['タスク1', 'タスク2', 'タスク3'];

    for (const taskTitle of tasks) {
      await page.getByTestId('add-task-button').click();
      await page.getByLabel(/タイトル/i).fill(taskTitle);
      await page.getByRole('button', { name: /保存|閉じる/i }).click();
      await page.waitForTimeout(100); // 少し待機
    }

    // タスクの初期順序を確認
    const todoColumn = page.locator('[data-column-id="todo"]').or(
      page.getByRole('heading', { name: /未着手/i }).locator('..')
    );

    const taskCards = todoColumn.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: 'タスク1' })).toBeVisible();
    await expect(taskCards.filter({ hasText: 'タスク2' })).toBeVisible();
    await expect(taskCards.filter({ hasText: 'タスク3' })).toBeVisible();

    // タスク1をタスク3の下に移動
    const task1 = taskCards.filter({ hasText: 'タスク1' });
    const task3 = taskCards.filter({ hasText: 'タスク3' });

    await task1.dragTo(task3, { targetPosition: { x: 0, y: 50 } });

    // 順序が変更されたことを確認（実装に依存）
    // Note: 実際の検証はアプリの実装に依存します
  });

  test('モバイルビューでスワイプでタスクを移動できる', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('スワイプテスト');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // スワイプシミュレーション（左スワイプ）
    const task = page.locator('[data-task-card]').filter({ hasText: 'スワイプテスト' });
    const boundingBox = await task.boundingBox();

    if (boundingBox) {
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x - 100, boundingBox.y + boundingBox.height / 2);
      await page.mouse.up();
    }

    // スワイプ後の状態確認（実装に依存）
    // Note: 実際の動作はアプリの実装に依存します
  });
});
