import { describe, it, expect } from 'vitest';
import {
  calculateNextDueDate,
  isRecurrenceEnded,
  getRecurrenceDescription,
} from './recurrenceService';
import { RecurrenceRule } from '@/types';

describe('recurrenceService', () => {
  describe('calculateNextDueDate', () => {
    it('daily: 1日後の日付を計算する', () => {
      const currentDueDate = '2024-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
      };

      const result = calculateNextDueDate(currentDueDate, recurrence);
      const expected = new Date('2024-01-02T00:00:00.000Z').toISOString();

      expect(result).toBe(expected);
    });

    it('daily: 3日ごとの日付を計算する', () => {
      const currentDueDate = '2024-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 3,
      };

      const result = calculateNextDueDate(currentDueDate, recurrence);
      const expected = new Date('2024-01-04T00:00:00.000Z').toISOString();

      expect(result).toBe(expected);
    });

    it('weekly: 1週間後の日付を計算する', () => {
      const currentDueDate = '2024-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'weekly',
        interval: 1,
      };

      const result = calculateNextDueDate(currentDueDate, recurrence);
      const expected = new Date('2024-01-08T00:00:00.000Z').toISOString();

      expect(result).toBe(expected);
    });

    it('weekly: 2週間ごとの日付を計算する', () => {
      const currentDueDate = '2024-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'weekly',
        interval: 2,
      };

      const result = calculateNextDueDate(currentDueDate, recurrence);
      const expected = new Date('2024-01-15T00:00:00.000Z').toISOString();

      expect(result).toBe(expected);
    });

    it('monthly: 1ヶ月後の日付を計算する', () => {
      const currentDueDate = '2024-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'monthly',
        interval: 1,
      };

      const result = calculateNextDueDate(currentDueDate, recurrence);
      const expected = new Date('2024-02-01T00:00:00.000Z').toISOString();

      expect(result).toBe(expected);
    });

    it('monthly: 3ヶ月ごとの日付を計算する', () => {
      const currentDueDate = '2024-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'monthly',
        interval: 3,
      };

      const result = calculateNextDueDate(currentDueDate, recurrence);
      const expected = new Date('2024-04-01T00:00:00.000Z').toISOString();

      expect(result).toBe(expected);
    });
  });

  describe('isRecurrenceEnded', () => {
    it('endDateがない場合はfalseを返す', () => {
      const nextDueDate = '2024-12-31T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
      };

      const result = isRecurrenceEnded(nextDueDate, recurrence);

      expect(result).toBe(false);
    });

    it('次の期限が終了日より前の場合はfalseを返す', () => {
      const nextDueDate = '2024-06-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
        endDate: '2024-12-31',
      };

      const result = isRecurrenceEnded(nextDueDate, recurrence);

      expect(result).toBe(false);
    });

    it('次の期限が終了日と同じ場合はfalseを返す', () => {
      const nextDueDate = '2024-12-31T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
        endDate: '2024-12-31',
      };

      const result = isRecurrenceEnded(nextDueDate, recurrence);

      expect(result).toBe(false);
    });

    it('次の期限が終了日より後の場合はtrueを返す', () => {
      const nextDueDate = '2025-01-01T00:00:00.000Z';
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
        endDate: '2024-12-31',
      };

      const result = isRecurrenceEnded(nextDueDate, recurrence);

      expect(result).toBe(true);
    });
  });

  describe('getRecurrenceDescription', () => {
    it('daily: interval=1の場合は「毎日」と表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('毎日');
    });

    it('daily: interval>1の場合は「N日ごと」と表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 3,
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('3日ごと');
    });

    it('weekly: interval=1の場合は「毎週」と表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'weekly',
        interval: 1,
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('毎週');
    });

    it('weekly: interval>1の場合は「N週ごと」と表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'weekly',
        interval: 2,
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('2週ごと');
    });

    it('monthly: interval=1の場合は「毎ヶ月」と表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'monthly',
        interval: 1,
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('毎ヶ月');
    });

    it('monthly: interval>1の場合は「Nヶ月ごと」と表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'monthly',
        interval: 3,
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('3ヶ月ごと');
    });

    it('endDateがある場合は終了日を含めた説明を表示する', () => {
      const recurrence: RecurrenceRule = {
        type: 'daily',
        interval: 1,
        endDate: '2024-12-31',
      };

      const result = getRecurrenceDescription(recurrence);

      expect(result).toBe('毎日 (2024-12-31まで)');
    });
  });
});
