import { test, expect } from '@playwright/test';

test.describe('フィルター・検索', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('検索でタスクを絞り込める', async ({ page }) => {
    // テスト用タスクを作成
    const tasks = ['リンゴを買う', 'バナナを買う', '牛乳を買う'];

    for (const taskTitle of tasks) {
      await page.getByTestId('add-task-button').click();
      await page.getByLabel(/タイトル/i).fill(taskTitle);
      await page.getByRole('button', { name: /保存|閉じる/i }).click();
      await page.waitForTimeout(100);
    }

    // すべてのタスクが表示されていることを確認（タスクカード内）
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: 'リンゴを買う' })).toBeVisible();
    await expect(taskCards.filter({ hasText: 'バナナを買う' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '牛乳を買う' })).toBeVisible();

    // 検索フィールドに入力
    const searchInput = page.getByRole('textbox', { name: /タスク検索/i });
    await searchInput.fill('バナナ');

    // 「バナナを買う」のみが表示されることを確認
    await expect(taskCards.filter({ hasText: 'バナナを買う' })).toBeVisible();
    await expect(taskCards.filter({ hasText: 'リンゴを買う' })).not.toBeVisible();
    await expect(taskCards.filter({ hasText: '牛乳を買う' })).not.toBeVisible();

    // 検索をクリア
    await searchInput.clear();

    // すべてのタスクが再び表示されることを確認
    await expect(taskCards.filter({ hasText: 'リンゴを買う' })).toBeVisible();
    await expect(taskCards.filter({ hasText: 'バナナを買う' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '牛乳を買う' })).toBeVisible();
  });

  test('優先度でフィルタリングできる', async ({ page }) => {
    // 異なる優先度のタスクを作成
    const tasks = [
      { title: '低優先度タスク', priority: '低' },
      { title: '高優先度タスク', priority: '高' },
      { title: '緊急タスク', priority: '緊急' },
    ];

    for (const task of tasks) {
      await page.getByTestId('add-task-button').click();
      await page.getByLabel(/タイトル/i).fill(task.title);

      // Selectコンポーネントを開く
      await page.getByRole('combobox').first().click();
      // 優先度オプションを選択
      await page.getByRole('option', { name: task.priority }).click();

      await page.getByRole('button', { name: /保存|閉じる/i }).click();
      await page.waitForTimeout(100);
    }

    // フィルターボタンをクリック
    await page.getByRole('button', { name: /フィルター/i }).click();

    // 「高」優先度フィルターを選択（buttonとして実装されている）
    await page.getByRole('button', { name: '高', exact: true }).click();

    // タスクカード内で確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '高優先度タスク' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '低優先度タスク' })).not.toBeVisible();
    await expect(taskCards.filter({ hasText: '緊急タスク' })).not.toBeVisible();
  });

  test('タグでフィルタリングできる', async ({ page }) => {
    // タグを作成
    await page.getByRole('button', { name: '管理', exact: true }).click();
    await page.getByTestId('open-tag-manager').click();

    // タグを追加
    await page.getByPlaceholder(/タグ名を入力/i).fill('重要');
    await page.getByRole('button', { name: /追加/i }).click();
    await page.getByPlaceholder(/タグ名を入力/i).fill('緊急');
    await page.getByRole('button', { name: /追加/i }).click();
    await page.getByRole('button', { name: /閉じる/i }).click();

    // タグ付きタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('重要なタスク');

    // タグを選択（ダイアログ内のボタンとして実装されている）
    await page.getByRole('dialog').getByRole('button', { name: '重要' }).click();

    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // 別のタグ付きタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('緊急なタスク');
    await page.getByRole('dialog').getByRole('button', { name: '緊急' }).click();
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // フィルターを適用
    await page.getByRole('button', { name: /フィルター/i }).click();
    // フィルターパネル内の「重要」ボタンをクリック
    await page.getByRole('button', { name: '重要', exact: true }).last().click();

    // 「重要なタスク」のみが表示されることを確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '重要なタスク' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '緊急なタスク' })).not.toBeVisible();
  });

  test('担当者でフィルタリングできる', async ({ page }) => {
    // メンバーを追加
    await page.getByRole('button', { name: '管理', exact: true }).click();
    await page.getByTestId('open-member-manager').click();

    await page.getByPlaceholder(/メンバー名を入力/i).fill('田中');
    await page.getByRole('button', { name: /追加/i }).click();
    await page.getByPlaceholder(/メンバー名を入力/i).fill('佐藤');
    await page.getByRole('button', { name: /追加/i }).click();
    await page.getByRole('button', { name: /閉じる/i }).click();

    // 担当者付きタスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('田中さんのタスク');
    await page.getByRole('dialog').getByRole('button', { name: '田中' }).click();
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('佐藤さんのタスク');
    await page.getByRole('dialog').getByRole('button', { name: '佐藤' }).click();
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // フィルターを適用
    await page.getByRole('button', { name: /フィルター/i }).click();
    // フィルターパネル内の「田中」ボタンをクリック
    await page.getByRole('button', { name: '田中', exact: true }).last().click();

    // 「田中さんのタスク」のみが表示されることを確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '田中さんのタスク' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '佐藤さんのタスク' })).not.toBeVisible();
  });

  test('複数フィルターを同時適用できる', async ({ page }) => {
    // 簡単なテスト: 複数の優先度フィルターを適用
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('高優先度タスク');
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '高' }).click();
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('低優先度タスク');
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '低' }).click();
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // 複数フィルターを適用
    await page.getByRole('button', { name: /フィルター/i }).click();
    await page.getByRole('button', { name: '高', exact: true }).click();
    await page.getByRole('button', { name: '低', exact: true }).click();

    // 両方の優先度のタスクが表示されることを確認
    const taskCards = page.locator('[data-task-card]');
    await expect(taskCards.filter({ hasText: '高優先度タスク' })).toBeVisible();
    await expect(taskCards.filter({ hasText: '低優先度タスク' })).toBeVisible();
  });

  test('フィルタークリアボタンですべてのフィルターをクリアできる', async ({ page }) => {
    // タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('テストタスク');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // フィルターを適用
    await page.getByRole('button', { name: /フィルター/i }).click();
    await page.getByRole('button', { name: '高', exact: true }).click();

    // フィルタークリアボタンをクリック
    await page.getByRole('button', { name: /クリア/i }).click();

    // フィルターがクリアされたことを確認（フィルターボタンがoutline variantに戻る）
    const filterButton = page.getByRole('button', { name: /フィルター/i }).first();
    // フィルターがクリアされているので、カウントバッジが表示されない
    await expect(filterButton.locator('span').filter({ hasText: /^\d+$/ })).not.toBeVisible();
  });
});
