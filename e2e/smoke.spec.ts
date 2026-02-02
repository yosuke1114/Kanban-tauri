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

  test('タスク追加ボタンが表示される', async ({ page }) => {
    await page.goto('/');

    // タスク追加ボタンが表示されていることを確認
    const addButton = page.getByTestId('add-task-button');
    await expect(addButton).toBeVisible();

    // ボタンをクリックするとダイアログが開くことを確認
    await addButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('管理メニューが表示される', async ({ page }) => {
    await page.goto('/');

    // 管理メニューボタンが表示されていることを確認
    const settingsButton = page.getByRole('button', { name: '管理', exact: true });
    await expect(settingsButton).toBeVisible();

    // 管理メニューを開く
    await settingsButton.click();

    // メンバー管理とタグ管理のメニュー項目が表示されることを確認
    await expect(page.getByTestId('open-member-manager')).toBeVisible();
    await expect(page.getByTestId('open-tag-manager')).toBeVisible();
  });
});
