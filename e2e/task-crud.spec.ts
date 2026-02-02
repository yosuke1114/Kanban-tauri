import { test, expect } from '@playwright/test';

test.describe('タスクCRUD操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ページロード完了を待機
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('タスクを作成できる', async ({ page }) => {
    // タスク追加ボタンをクリック
    await page.getByTestId('add-task-button').click();

    // EditTaskDialogが開くまで待機
    await expect(page.getByRole('dialog')).toBeVisible();

    // タスクタイトルを入力
    const titleInput = page.getByLabel(/タイトル/i);
    await titleInput.fill('E2Eテストタスク');

    // 説明を入力
    const descriptionInput = page.getByLabel(/説明/i);
    await descriptionInput.fill('これはE2Eテストで作成されたタスクです');

    // 優先度を選択（Selectコンポーネントの最初のものを開く）
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '高' }).click();

    // 保存ボタンをクリック
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // ダイアログが閉じることを確認
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // トーストが表示されることを確認
    await expect(page.getByText(/タスクを作成しました/i)).toBeVisible();

    // タスクカード内に表示されることを確認
    await expect(page.locator('[data-task-card]').getByText('E2Eテストタスク')).toBeVisible();
  });

  test('タスクを編集できる', async ({ page }) => {
    // まずタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('編集前のタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクをクリックして編集ダイアログを開く
    await page.locator('[data-task-card]').filter({ hasText: '編集前のタスク' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // タイトルを変更
    const titleInput = page.getByLabel(/タイトル/i);
    await titleInput.clear();
    await titleInput.fill('編集後のタスク');

    // 保存
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // 編集後のタイトルが表示されることを確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '編集後のタスク' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '編集前のタスク' })).not.toBeVisible();
  });

  test('タスクを削除できる', async ({ page }) => {
    // まずタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('削除するタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクが作成されたことを確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '削除するタスク' })).toBeVisible();

    // タスクをクリックして編集ダイアログを開く
    await taskCards.filter({ hasText: '削除するタスク' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 削除ボタンをクリック
    await page.getByRole('button', { name: /削除/i }).click();

    // 確認ダイアログで削除を確定
    await page.getByRole('button', { name: /ゴミ箱に移動/i }).click();

    // タスクが表示されなくなることを確認
    await expect(taskCards.filter({ hasText: '削除するタスク' })).not.toBeVisible();
  });

  test('タスクを複製できる', async ({ page }) => {
    // まずタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('複製元タスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクが作成されたことを確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '複製元タスク' })).toBeVisible();

    // タスクを右クリック（コンテキストメニュー）
    await taskCards.filter({ hasText: '複製元タスク' }).click({ button: 'right' });

    // 複製ボタンをクリック
    await page.getByRole('menuitem', { name: /複製/i }).click();

    // 複製されたタスクが表示されることを確認
    await expect(taskCards.filter({ hasText: '複製元タスク (コピー)' })).toBeVisible();
  });

  test('タスクにサブタスクを追加できる', async ({ page }) => {
    // まずタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('サブタスク付きタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクをクリックして編集
    await page.locator('[data-task-card]').filter({ hasText: 'サブタスク付きタスク' }).click();

    // サブタスク入力欄を探す
    const subtaskInput = page.getByPlaceholder(/サブタスクを追加/i);
    await subtaskInput.fill('サブタスク1');
    await subtaskInput.press('Enter');

    // サブタスクが追加されたことを確認（ダイアログ内）
    await expect(page.getByRole('dialog').getByText('サブタスク1')).toBeVisible();

    // サブタスクをチェック
    const subtaskCheckbox = page.getByRole('dialog').getByRole('checkbox').filter({
      has: page.locator('text=サブタスク1')
    }).or(
      page.getByRole('dialog').locator('input[type="checkbox"]').first()
    );
    await subtaskCheckbox.check();

    // チェックされたことを確認（line-throughスタイル）
    const checkedTask = page.getByRole('dialog').locator('span.line-through', { hasText: 'サブタスク1' });
    await expect(checkedTask).toBeVisible();
  });

  test('期限を設定できる', async ({ page }) => {
    // タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('期限付きタスク');

    // 期限を設定
    const dueDateInput = page.getByLabel(/期限/i);
    await dueDateInput.fill('2026-12-31');

    // 保存
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクカードに期限が表示されることを確認
    const taskCard = page.locator('[data-task-card]').filter({ hasText: '期限付きタスク' });
    await expect(taskCard.getByText(/12\/31/)).toBeVisible();
  });
});
