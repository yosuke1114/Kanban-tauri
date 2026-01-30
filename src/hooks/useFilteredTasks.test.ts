import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredTasks } from './useFilteredTasks';
import { useBoardStore } from '@/stores/useBoardStore';

// ストアのリセット用ヘルパー
const resetStore = () => {
  const store = useBoardStore.getState();
  store.tasks = {};
  store.columns = {
    todo: {
      id: 'todo',
      title: '未着手',
      color: '#94a3b8',
      position: 0,
      isDefault: true,
    },
    inProgress: {
      id: 'inProgress',
      title: '進行中',
      color: '#60a5fa',
      position: 1,
      isDefault: true,
    },
    done: {
      id: 'done',
      title: '完了',
      color: '#34d399',
      position: 2,
      isDefault: true,
    },
  };
  store.columnOrder = ['todo', 'inProgress', 'done'];
  store.members = {};
  store.tags = {};
  store.filters = {
    tagIds: [],
    assigneeIds: [],
    priorities: [],
  };
};

describe('useFilteredTasks', () => {
  beforeEach(() => {
    resetStore();
  });

  it('フィルターなしの場合、全タスクを返す', () => {
    const { addTask } = useBoardStore.getState();

    addTask('todo', 'タスク1');
    addTask('todo', 'タスク2');
    addTask('todo', 'タスク3');

    const { result } = renderHook(() => useFilteredTasks());

    expect(result.current).toHaveLength(3);
  });

  it('タグフィルターで一致するタスクのみを返す', () => {
    const { addTask, addTag, updateTask, setFilters } =
      useBoardStore.getState();

    addTag('タグA', '#ff0000');
    addTag('タグB', '#00ff00');

    const tagIds = Object.keys(useBoardStore.getState().tags);

    addTask('todo', 'タスク1');
    addTask('todo', 'タスク2');
    addTask('todo', 'タスク3');

    const taskIds = Object.keys(useBoardStore.getState().tasks);
    updateTask(taskIds[0], { tagIds: [tagIds[0]] });
    updateTask(taskIds[1], { tagIds: [tagIds[1]] });
    updateTask(taskIds[2], { tagIds: [tagIds[0], tagIds[1]] });

    setFilters({ tagIds: [tagIds[0]] });

    const { result } = renderHook(() => useFilteredTasks());

    expect(result.current).toHaveLength(2); // タスク1とタスク3
    expect(result.current.every((t) => t.tagIds.includes(tagIds[0]))).toBe(
      true
    );
  });

  it('担当者フィルターで一致するタスクのみを返す', () => {
    const { addTask, addMember, updateTask, setFilters } =
      useBoardStore.getState();

    addMember('ユーザーA', '#0000ff');
    addMember('ユーザーB', '#ffff00');

    const memberIds = Object.keys(useBoardStore.getState().members);

    addTask('todo', 'タスク1');
    addTask('todo', 'タスク2');
    addTask('todo', 'タスク3');

    const taskIds = Object.keys(useBoardStore.getState().tasks);
    updateTask(taskIds[0], { assigneeIds: [memberIds[0]] });
    updateTask(taskIds[1], { assigneeIds: [memberIds[1]] });
    updateTask(taskIds[2], { assigneeIds: [memberIds[0]] });

    setFilters({ assigneeIds: [memberIds[0]] });

    const { result } = renderHook(() => useFilteredTasks());

    expect(result.current).toHaveLength(2); // タスク1とタスク3
    expect(
      result.current.every((t) => t.assigneeIds.includes(memberIds[0]))
    ).toBe(true);
  });

  it('優先度フィルターで一致するタスクのみを返す', () => {
    const { addTask, updateTask, setFilters } = useBoardStore.getState();

    addTask('todo', 'タスク1');
    addTask('todo', 'タスク2');
    addTask('todo', 'タスク3');

    const taskIds = Object.keys(useBoardStore.getState().tasks);
    updateTask(taskIds[0], { priority: 'high' });
    updateTask(taskIds[1], { priority: 'low' });
    updateTask(taskIds[2], { priority: 'medium' });

    setFilters({ priorities: ['high', 'low'] });

    const { result } = renderHook(() => useFilteredTasks());

    expect(result.current).toHaveLength(2); // タスク1とタスク2
    expect(
      result.current.every(
        (t) => t.priority === 'high' || t.priority === 'low'
      )
    ).toBe(true);
  });

  it('複合フィルター（AND条件）で絞り込む', () => {
    const { addTask, addTag, addMember, updateTask, setFilters } =
      useBoardStore.getState();

    addTag('タグA', '#ff0000');
    addMember('ユーザーA', '#0000ff');

    const tagIds = Object.keys(useBoardStore.getState().tags);
    const memberIds = Object.keys(useBoardStore.getState().members);

    addTask('todo', 'タスク1');
    addTask('todo', 'タスク2');
    addTask('todo', 'タスク3');

    const taskIds = Object.keys(useBoardStore.getState().tasks);
    // タスク1: タグA + ユーザーA + high
    updateTask(taskIds[0], {
      tagIds: [tagIds[0]],
      assigneeIds: [memberIds[0]],
      priority: 'high',
    });
    // タスク2: タグA + ユーザーA + low
    updateTask(taskIds[1], {
      tagIds: [tagIds[0]],
      assigneeIds: [memberIds[0]],
      priority: 'low',
    });
    // タスク3: タグA + 担当者なし + high
    updateTask(taskIds[2], {
      tagIds: [tagIds[0]],
      assigneeIds: [],
      priority: 'high',
    });

    setFilters({
      tagIds: [tagIds[0]],
      assigneeIds: [memberIds[0]],
      priorities: ['high'],
    });

    const { result } = renderHook(() => useFilteredTasks());

    expect(result.current).toHaveLength(1); // タスク1のみ
    expect(result.current[0].priority).toBe('high');
    expect(result.current[0].tagIds).toContain(tagIds[0]);
    expect(result.current[0].assigneeIds).toContain(memberIds[0]);
  });
});
