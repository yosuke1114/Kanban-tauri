import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('アプリが正常に表示される', async ({ page }) => {
    // コンソールエラーを監視
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // 白い画面でないことを確認（h1タグが存在する）
    await expect(page.locator('h1').first()).toBeVisible();

    // 待機してコンソールエラーを収集
    await page.waitForTimeout(1000);

    // コンソールエラーがないことを確認
    expect(errors).toHaveLength(0);
  });

  test('タスク一覧が表示される', async ({ page }) => {
    await page.goto('/');

    // 3つのデフォルトカラムが表示されていることを確認（heading roleで特定）
    await expect(page.getByRole('heading', { name: /未着手/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /進行中/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /完了/ })).toBeVisible();
  });

  test('タスク追加フォームが表示される', async ({ page }) => {
    await page.goto('/');

    // タスク追加入力欄が表示されていることを確認
    const addInput = page.getByPlaceholder(/新しいタスクを追加/i);
    await expect(addInput).toBeVisible();
  });

  test('メンバー管理とタグ管理が表示される', async ({ page }) => {
    await page.goto('/');

    // メンバー管理セクションが表示されていることを確認
    await expect(page.getByText('メンバー管理').or(page.getByText('Member Management'))).toBeVisible();

    // タグ管理セクションが表示されていることを確認
    await expect(page.getByText('タグ管理').or(page.getByText('Tag Management'))).toBeVisible();
  });
});
