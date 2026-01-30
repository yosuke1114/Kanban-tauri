import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Tauri APIのモック
beforeAll(() => {
  // Tauri APIが存在しない環境でのモック
  if (typeof window !== 'undefined') {
    window.__TAURI__ = {
      invoke: vi.fn(),
    } as any;
  }
});

afterEach(() => {
  // 各テスト後にlocalStorageのモックをクリア
  vi.clearAllMocks();
});

afterAll(() => {
  vi.clearAllMocks();
});
