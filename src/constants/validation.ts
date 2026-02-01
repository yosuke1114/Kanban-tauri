/**
 * 入力フィールドの文字数制限定数
 */
export const INPUT_LIMITS = {
  TASK_TITLE: 100,
  TASK_DESCRIPTION: 500,
  SUBTASK_TITLE: 100,
  MEMBER_NAME: 50,
  TAG_NAME: 30,
  COLUMN_TITLE: 30,
  BOARD_NAME: 50,
} as const;

/**
 * バリデーションメッセージ
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: '入力してください',
  MAX_LENGTH: (limit: number) => `${limit}文字以内で入力してください`,
  WHITESPACE_ONLY: '空白のみは入力できません',
} as const;

/**
 * 入力値のバリデーション
 */
export const validateInput = {
  /**
   * 必須チェック（空白のみも不可）
   */
  required: (value: string): string | null => {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.WHITESPACE_ONLY;
    }
    return null;
  },

  /**
   * 文字数制限チェック
   */
  maxLength: (value: string, limit: number): string | null => {
    if (value.length > limit) {
      return VALIDATION_MESSAGES.MAX_LENGTH(limit);
    }
    return null;
  },

  /**
   * 汎用バリデーション（必須 + 文字数制限）
   */
  general: (value: string, limit: number): string | null => {
    const requiredError = validateInput.required(value);
    if (requiredError) return requiredError;

    const lengthError = validateInput.maxLength(value, limit);
    if (lengthError) return lengthError;

    return null;
  },
};
