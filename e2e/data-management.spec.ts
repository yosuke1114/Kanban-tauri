import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('データ管理（エクスポート/インポート）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('データをエクスポートできる', async ({ page }) => {
    // テスト用タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('エクスポートテスト');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // 管理メニューを開く
    await page.getByRole('button', { name: '管理', exact: true }).click();

    // データ保存設定をクリック
    await page.getByTestId('open-storage-settings').click();

    // エクスポートボタンをクリック
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /エクスポート/i }).click();

    // ダウンロードが開始されることを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/kanban-board.*\.json/);

    // ダウンロードしたファイルの内容を確認
    const downloadPath = await download.path();
    if (downloadPath) {
      const fs = require('fs');
      const content = fs.readFileSync(downloadPath, 'utf-8');
      const data = JSON.parse(content);

      // データ構造を確認
      expect(data).toHaveProperty('boards');
      expect(data).toHaveProperty('members');

      // テストタスクが含まれていることを確認
      const tasks = Object.values(data.boards).flatMap((board: any) => Object.values(board.tasks || {}));
      const testTask = tasks.find((task: any) => task.title === 'エクスポートテスト');
      expect(testTask).toBeDefined();
    }
  });

  test.skip('データをインポートできる', async ({ page }) => {
    // Note: ファイルアップロードのテストはブラウザ環境によって制限があるためスキップ
    // 実装する場合は、テストデータファイルを準備してアップロードする

    // サンプルデータファイルを準備
    const testDataPath = path.join(__dirname, '../fixtures/test-data.json');

    // 管理メニューを開く
    await page.getByRole('button', { name: '管理', exact: true }).click();
    await page.getByTestId('open-storage-settings').click();

    // インポートボタンをクリック
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /インポート/i }).click();
    const fileChooser = await fileChooserPromise;

    // ファイルを選択
    await fileChooser.setFiles(testDataPath);

    // インポートが成功したことを確認
    await expect(page.getByText(/インポートしました/i)).toBeVisible();
  });

  test('localStorage/ファイルストレージが正しく保存される', async ({ page }) => {
    // タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('保存テスト');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // タスクが表示されることを確認（タスクカード内）
    await expect(page.locator('[data-task-card]').getByText('保存テスト')).toBeVisible();

    // ページをリロード
    await page.reload();

    // タスクが復元されることを確認
    await expect(page.locator('[data-task-card]').getByText('保存テスト')).toBeVisible();
  });

  test('データ削除後にクリーンな状態に戻る', async ({ page }) => {
    // タスクを作成
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/タイトル/i).fill('削除テスト');
    await page.getByRole('button', { name: /保存|閉じる/i }).click();

    // localStorageをクリア（開発者ツールで実行）
    await page.evaluate(() => {
      localStorage.clear();
    });

    // ページをリロード
    await page.reload();

    // タスクが消えていることを確認
    await expect(page.getByText('削除テスト')).not.toBeVisible();

    // デフォルトのカラムは存在することを確認
    await expect(page.getByRole('heading', { name: /未着手/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /進行中/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /完了/i })).toBeVisible();
  });
});
