import { describe, it, expect, beforeEach, vi } from "vitest";
import { StorageManager, StorageType } from "./storageManager";

describe("StorageManager", () => {
  let manager: StorageManager;
  let storage: Record<string, string> = {};

  beforeEach(() => {
    // localStorageのモックを実際のストレージとして動作するように設定
    storage = {};
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => storage[key] || null);
    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      storage[key] = value;
    });
    vi.mocked(localStorage.clear).mockImplementation(() => {
      storage = {};
    });

    // デフォルトでlocalStorageを使用するように設定を保存
    storage["kanbanStorageConfig"] = JSON.stringify({ type: "localStorage" });
    manager = new StorageManager();
  });

  describe("getConfig", () => {
    it("初期設定を取得できる", () => {
      const config = manager.getConfig();
      expect(config).toBeDefined();
      expect(config.type).toBeDefined();
    });
  });

  describe("setStorageType", () => {
    it("ストレージタイプを設定できる", async () => {
      await manager.setStorageType("localStorage");
      const config = manager.getConfig();
      expect(config.type).toBe("localStorage");
    });

    it("Tauriファイルパスを設定できる", async () => {
      const testPath = "/test/path";
      await manager.setStorageType("tauriFile", testPath);
      const config = manager.getConfig();
      expect(config.type).toBe("tauriFile");
      expect(config.tauriFilePath).toBe(testPath);
    });
  });

  describe("saveData and loadData", () => {
    it("localStorageにデータを保存・読み込みできる", async () => {
      await manager.setStorageType("localStorage");
      const testData = '{"test": "data"}';
      await manager.saveData(testData);
      const loaded = await manager.loadData();
      expect(loaded).toBe(testData);
    });
  });

  describe("exportBackup", () => {
    it("データをエクスポートできる", async () => {
      await manager.setStorageType("localStorage");
      const testData = '{"test": "data"}';
      await manager.saveData(testData);
      const exported = await manager.exportBackup();
      expect(exported).toBe(testData);
    });

    it("データが存在しない場合はエラーをスローする", async () => {
      await expect(manager.exportBackup()).rejects.toThrow(
        "エクスポートするデータが存在しません"
      );
    });
  });

  describe("importBackup", () => {
    it("有効なJSONをインポートできる", async () => {
      const testData = '{"test": "data"}';
      await manager.importBackup(testData);
      const loaded = await manager.loadData();
      expect(loaded).toBe(testData);
    });

    it("無効なJSONの場合はエラーをスローする", async () => {
      const invalidJson = "not a json";
      await expect(manager.importBackup(invalidJson)).rejects.toThrow(
        "無効なJSON形式です"
      );
    });
  });

  describe("getDataPath", () => {
    it("localStorageの場合はパス文字列を返す", async () => {
      await manager.setStorageType("localStorage");
      const path = await manager.getDataPath();
      expect(path).toBe("ブラウザストレージ（localStorage）");
    });
  });
});
