import { invoke } from "@tauri-apps/api/tauri";

export interface StorageService {
  save: (data: string) => Promise<void>;
  load: () => Promise<string | null>;
  getDataPath: () => Promise<string>;
}

class TauriStorage implements StorageService {
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
    try {
      return await invoke<string>("get_data_path");
    } catch (error) {
      console.error("データパスの取得に失敗しました:", error);
      return "";
    }
  }
}

class LocalStorage implements StorageService {
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
    return "localStorage";
  }
}

// Tauriアプリかどうかを判定
const isTauriApp = typeof window !== "undefined" && "__TAURI__" in window;

export const storage: StorageService = isTauriApp
  ? new TauriStorage()
  : new LocalStorage();
