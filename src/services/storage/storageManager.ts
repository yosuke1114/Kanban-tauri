import { invoke } from "@tauri-apps/api/tauri";
import { dialog } from "@tauri-apps/api";
import { StorageService } from "./tauriStorage";

export type StorageType = "localStorage" | "tauriFile" | "sharepoint";

export interface StorageConfig {
  type: StorageType;
  tauriFilePath?: string; // Tauriファイルの保存先ディレクトリ
  sharepointConfig?: {
    // 将来のSharePoint対応用
    siteUrl?: string;
    listName?: string;
  };
}

/**
 * ストレージマネージャー
 * 複数のストレージタイプを管理し、データの保存・読み込み・移行を行う
 */
export class StorageManager {
  private config: StorageConfig;
  private readonly CONFIG_KEY = "kanbanStorageConfig";

  constructor() {
    // 設定をlocalStorageから読み込み
    const savedConfig = localStorage.getItem(this.CONFIG_KEY);
    this.config = savedConfig
      ? JSON.parse(savedConfig)
      : {
          type: this.isTauriApp() ? "tauriFile" : "localStorage",
          tauriFilePath: undefined,
        };
  }

  /**
   * Tauriアプリかどうかを判定
   */
  private isTauriApp(): boolean {
    return typeof window !== "undefined" && "__TAURI__" in window;
  }

  /**
   * 現在のストレージ設定を取得
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * ストレージタイプを設定
   */
  async setStorageType(
    type: StorageType,
    tauriFilePath?: string
  ): Promise<void> {
    this.config.type = type;
    if (type === "tauriFile" && tauriFilePath) {
      this.config.tauriFilePath = tauriFilePath;
    }
    this.saveConfig();
  }

  /**
   * 設定を保存
   */
  private saveConfig(): void {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
  }

  /**
   * データを現在のストレージに保存
   */
  async saveData(data: string): Promise<void> {
    const storage = this.getStorageService();
    await storage.save(data);
  }

  /**
   * データを現在のストレージから読み込み
   */
  async loadData(): Promise<string | null> {
    const storage = this.getStorageService();
    return await storage.load();
  }

  /**
   * 現在のストレージタイプに応じたStorageServiceを取得
   */
  private getStorageService(): StorageService {
    switch (this.config.type) {
      case "tauriFile":
        return new TauriFileStorage(this.config.tauriFilePath);
      case "localStorage":
        return new LocalStorageService();
      case "sharepoint":
        // TODO: SharePoint対応時に実装
        throw new Error("SharePoint storage is not yet implemented");
      default:
        return new LocalStorageService();
    }
  }

  /**
   * Tauriファイルの保存先を選択
   */
  async selectTauriFilePath(): Promise<string | null> {
    if (!this.isTauriApp()) {
      throw new Error("Tauri app is required for this operation");
    }

    try {
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: "データ保存先を選択",
      });

      if (typeof selected === "string") {
        return selected;
      }
      return null;
    } catch (error) {
      console.error("ディレクトリ選択に失敗しました:", error);
      return null;
    }
  }

  /**
   * データを別のストレージタイプに移行
   */
  async migrateData(from: StorageType, to: StorageType): Promise<void> {
    // 移行元からデータを読み込み
    this.config.type = from;
    const data = await this.loadData();

    if (!data) {
      throw new Error("移行元にデータが存在しません");
    }

    // 移行先にデータを保存
    this.config.type = to;
    await this.saveData(data);

    // 設定を保存
    this.config.type = to;
    this.saveConfig();
  }

  /**
   * データをJSON文字列としてエクスポート
   */
  async exportBackup(): Promise<string> {
    const data = await this.loadData();
    if (!data) {
      throw new Error("エクスポートするデータが存在しません");
    }
    return data;
  }

  /**
   * JSON文字列からデータをインポート
   */
  async importBackup(json: string): Promise<void> {
    // JSONの妥当性を検証
    try {
      JSON.parse(json);
    } catch (error) {
      throw new Error("無効なJSON形式です");
    }

    await this.saveData(json);
  }

  /**
   * 現在のデータパスを取得
   */
  async getDataPath(): Promise<string> {
    const storage = this.getStorageService();
    return await storage.getDataPath();
  }
}

/**
 * Tauriファイルストレージ
 */
class TauriFileStorage implements StorageService {
  constructor(private customPath?: string) {}

  async save(data: string): Promise<void> {
    try {
      await invoke("save_board_data", { data });
    } catch (error) {
      console.error("Tauriへのデータ保存に失敗しました:", error);
      throw error;
    }
  }

  async load(): Promise<string | null> {
    try {
      const data = await invoke<string>("load_board_data");
      return data === "{}" ? null : data;
    } catch (error) {
      console.error("Tauriからのデータ読み込みに失敗しました:", error);
      return null;
    }
  }

  async getDataPath(): Promise<string> {
    if (this.customPath) {
      return this.customPath;
    }
    try {
      return await invoke<string>("get_data_path");
    } catch (error) {
      console.error("データパスの取得に失敗しました:", error);
      return "";
    }
  }
}

/**
 * LocalStorageサービス
 */
class LocalStorageService implements StorageService {
  private key = "kanbanBoardState";

  async save(data: string): Promise<void> {
    try {
      localStorage.setItem(this.key, data);
    } catch (error) {
      console.error("LocalStorageへのデータ保存に失敗しました:", error);
      throw error;
    }
  }

  async load(): Promise<string | null> {
    try {
      return localStorage.getItem(this.key);
    } catch (error) {
      console.error("LocalStorageからのデータ読み込みに失敗しました:", error);
      return null;
    }
  }

  async getDataPath(): Promise<string> {
    return "ブラウザストレージ（localStorage）";
  }
}

// シングルトンインスタンス
export const storageManager = new StorageManager();
