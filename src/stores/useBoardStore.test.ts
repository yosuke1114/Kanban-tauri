import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from './useBoardStore';

const DEFAULT_BOARD_ID = 'default';

const createDefaultColumns = () => ({
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
});

// ストアのリセット用ヘルパー（マルチボード対応）
const resetStore = () => {
  const now = new Date().toISOString();
  useBoardStore.setState({
    boards: {
      [DEFAULT_BOARD_ID]: {
        id: DEFAULT_BOARD_ID,
        name: 'メインボード',
        description: '',
        tasks: {},
        columns: createDefaultColumns(),
        columnOrder: ['todo', 'inProgress', 'done'],
        tags: {},
        createdAt: now,
        updatedAt: now,
      },
    },
    boardOrder: [DEFAULT_BOARD_ID],
    currentBoardId: DEFAULT_BOARD_ID,
    members: {},
    currentUserId: undefined,
    filters: {
      tagIds: [],
      assigneeIds: [],
      priorities: [],
    },
    searchQuery: '',
  });
};

describe('useBoardStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ヘルパー: 現在のボードのタスクを取得
  const getTasks = () => {
    const state = useBoardStore.getState();
    return state.boards[state.currentBoardId]?.tasks || {};
  };

  // ヘルパー: 現在のボードの列を取得
  const getColumns = () => {
    const state = useBoardStore.getState();
    return state.boards[state.currentBoardId]?.columns || {};
  };

  // ヘルパー: 現在のボードのタグを取得
  const getTags = () => {
    const state = useBoardStore.getState();
    return state.boards[state.currentBoardId]?.tags || {};
  };

  describe('addTask', () => {
    it('タスクを追加する', () => {
      const { addTask } = useBoardStore.getState();

      addTask('todo', 'テストタスク');

      const tasks = Object.values(getTasks());
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('テストタスク');
      expect(tasks[0].columnId).toBe('todo');
      expect(tasks[0].position).toBe(0);
    });

    it('同じ列に複数タスクを追加すると、positionが増加する', () => {
      const { addTask } = useBoardStore.getState();

      addTask('todo', 'タスク1');
      addTask('todo', 'タスク2');
      addTask('todo', 'タスク3');

      const tasks = Object.values(getTasks());
      expect(tasks).toHaveLength(3);
      expect(tasks[0].position).toBe(0);
      expect(tasks[1].position).toBe(1);
      expect(tasks[2].position).toBe(2);
    });

    it('saveToStorageが呼ばれる', () => {
      const { addTask } = useBoardStore.getState();
      const localStorageMock = vi.mocked(localStorage);

      addTask('todo', 'テストタスク');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kanbanBoardState',
        expect.any(String)
      );
    });
  });

  describe('updateTask', () => {
    it('タスクを更新する', () => {
      const { addTask, updateTask } = useBoardStore.getState();

      addTask('todo', 'テストタスク');
      const taskId = Object.keys(getTasks())[0];
      const originalVersion = getTasks()[taskId].sync.version;

      updateTask(taskId, { title: '更新されたタスク', priority: 'high' });

      const updatedTask = getTasks()[taskId];
      expect(updatedTask.title).toBe('更新されたタスク');
      expect(updatedTask.priority).toBe('high');
      expect(updatedTask.sync.version).toBe(originalVersion + 1);
    });

    it('存在しないタスクの更新は無視される', () => {
      const { updateTask } = useBoardStore.getState();
      const initialTasks = getTasks();

      updateTask('non-existent-id', { title: '存在しない' });

      expect(getTasks()).toEqual(initialTasks);
    });
  });

  describe('deleteTask', () => {
    it('タスクを削除する', () => {
      const { addTask, deleteTask } = useBoardStore.getState();

      addTask('todo', 'テストタスク');
      const taskId = Object.keys(getTasks())[0];

      deleteTask(taskId);

      expect(Object.keys(getTasks())).toHaveLength(0);
    });
  });

  describe('moveTask', () => {
    it('タスクを同じ列内で移動する', () => {
      const { addTask, moveTask } = useBoardStore.getState();

      addTask('todo', 'タスク1');
      addTask('todo', 'タスク2');
      addTask('todo', 'タスク3');

      const taskIds = Object.keys(getTasks());
      const task1Id = taskIds[0];

      // タスク1を位置2に移動
      moveTask(task1Id, 'todo', 2);

      const tasks = Object.values(getTasks())
        .filter((t) => t.columnId === 'todo')
        .sort((a, b) => a.position - b.position);

      expect(tasks[0].title).toBe('タスク2');
      expect(tasks[1].title).toBe('タスク3');
      expect(tasks[2].title).toBe('タスク1');
    });

    it('タスクを別の列に移動する', () => {
      const { addTask, moveTask } = useBoardStore.getState();

      addTask('todo', 'テストタスク');
      const taskId = Object.keys(getTasks())[0];
      const originalVersion = getTasks()[taskId].sync.version;

      moveTask(taskId, 'inProgress', 0);

      const movedTask = getTasks()[taskId];
      expect(movedTask.columnId).toBe('inProgress');
      expect(movedTask.position).toBe(0);
      expect(movedTask.sync.version).toBe(originalVersion + 1);
    });
  });

  describe('deleteColumn', () => {
    it('デフォルト列も削除できる', () => {
      const { deleteColumn } = useBoardStore.getState();

      deleteColumn('todo');

      const columns = getColumns();
      expect(columns['todo']).toBeUndefined();
      expect(columns['inProgress']).toBeDefined();
      expect(columns['done']).toBeDefined();
    });

    it('カスタム列を削除する', () => {
      const { addColumn, deleteColumn } = useBoardStore.getState();

      addColumn('カスタム列', '#ff0000');
      const columnId = Object.keys(getColumns()).find(
        (id) => !['todo', 'inProgress', 'done'].includes(id)
      )!;

      deleteColumn(columnId);

      expect(getColumns()[columnId]).toBeUndefined();
    });

    it('列を削除すると、その列のタスクも削除される', () => {
      const { addColumn, addTask, deleteColumn } = useBoardStore.getState();

      addColumn('カスタム列', '#ff0000');
      const columnId = Object.keys(getColumns()).find(
        (id) => !['todo', 'inProgress', 'done'].includes(id)
      )!;

      addTask(columnId, 'カスタム列のタスク');
      addTask('todo', 'todoのタスク');

      deleteColumn(columnId);

      const tasks = Object.values(getTasks());
      expect(tasks).toHaveLength(1);
      expect(tasks[0].columnId).toBe('todo');
    });
  });

  describe('deleteMember', () => {
    it('メンバーを削除すると、タスクから担当者が削除される', () => {
      const { addMember, addTask, updateTask, deleteMember } =
        useBoardStore.getState();

      addMember('テストユーザー', '#ff0000');
      const memberId = Object.keys(useBoardStore.getState().members)[0];

      addTask('todo', 'テストタスク');
      const taskId = Object.keys(getTasks())[0];
      updateTask(taskId, { assigneeIds: [memberId] });

      deleteMember(memberId);

      const task = getTasks()[taskId];
      expect(task.assigneeIds).toEqual([]);
      expect(useBoardStore.getState().members[memberId]).toBeUndefined();
    });
  });

  describe('deleteTag', () => {
    it('タグを削除すると、タスクからタグが削除される', () => {
      const { addTag, addTask, updateTask, deleteTag } =
        useBoardStore.getState();

      addTag('テストタグ', '#ff0000');
      const tagId = Object.keys(getTags())[0];

      addTask('todo', 'テストタスク');
      const taskId = Object.keys(getTasks())[0];
      updateTask(taskId, { tagIds: [tagId] });

      deleteTag(tagId);

      const task = getTasks()[taskId];
      expect(task.tagIds).toEqual([]);
      expect(getTags()[tagId]).toBeUndefined();
    });
  });

  describe('getFilteredTasks', () => {
    beforeEach(() => {
      const { addTask, addTag, addMember, updateTask } =
        useBoardStore.getState();

      // タグとメンバーを作成
      addTag('タグA', '#ff0000');
      addTag('タグB', '#00ff00');
      addMember('ユーザーA', '#0000ff');
      addMember('ユーザーB', '#ffff00');

      const tagIds = Object.keys(getTags());
      const memberIds = Object.keys(useBoardStore.getState().members);

      // テストタスクを作成
      addTask('todo', 'タスク1');
      addTask('todo', 'タスク2');
      addTask('todo', 'タスク3');

      const taskIds = Object.keys(getTasks());
      updateTask(taskIds[0], {
        tagIds: [tagIds[0]],
        assigneeIds: [memberIds[0]],
        priority: 'high',
      });
      updateTask(taskIds[1], {
        tagIds: [tagIds[1]],
        assigneeIds: [memberIds[1]],
        priority: 'low',
      });
      updateTask(taskIds[2], {
        tagIds: [tagIds[0], tagIds[1]],
        assigneeIds: [memberIds[0]],
        priority: 'medium',
      });
    });

    it('フィルターなしの場合、全タスクを返す', () => {
      const { getFilteredTasks } = useBoardStore.getState();

      const filtered = getFilteredTasks();

      expect(filtered).toHaveLength(3);
    });

    it('タグフィルターで絞り込む', () => {
      const { setFilters, getFilteredTasks } = useBoardStore.getState();
      const tagIds = Object.keys(getTags());

      setFilters({ tagIds: [tagIds[0]] });
      const filtered = getFilteredTasks();

      expect(filtered).toHaveLength(2); // タスク1とタスク3
      expect(filtered.every((t) => t.tagIds.includes(tagIds[0]))).toBe(true);
    });

    it('担当者フィルターで絞り込む', () => {
      const { setFilters, getFilteredTasks } = useBoardStore.getState();
      const memberIds = Object.keys(useBoardStore.getState().members);

      setFilters({ assigneeIds: [memberIds[0]] });
      const filtered = getFilteredTasks();

      expect(filtered).toHaveLength(2); // タスク1とタスク3
      expect(filtered.every((t) => t.assigneeIds.includes(memberIds[0]))).toBe(
        true
      );
    });

    it('優先度フィルターで絞り込む', () => {
      const { setFilters, getFilteredTasks } = useBoardStore.getState();

      setFilters({ priorities: ['high', 'low'] });
      const filtered = getFilteredTasks();

      expect(filtered).toHaveLength(2); // タスク1とタスク2
      expect(
        filtered.every(
          (t) => t.priority === 'high' || t.priority === 'low'
        )
      ).toBe(true);
    });

    it('複合フィルターで絞り込む', () => {
      const { setFilters, getFilteredTasks } = useBoardStore.getState();
      const tagIds = Object.keys(getTags());
      const memberIds = Object.keys(useBoardStore.getState().members);

      setFilters({
        tagIds: [tagIds[0]],
        assigneeIds: [memberIds[0]],
        priorities: ['high'],
      });
      const filtered = getFilteredTasks();

      expect(filtered).toHaveLength(1); // タスク1のみ
      expect(filtered[0].priority).toBe('high');
    });
  });

  describe('clearFilters', () => {
    it('全てのフィルターをクリアする', () => {
      const { setFilters, clearFilters, hasActiveFilters } =
        useBoardStore.getState();

      setFilters({ tagIds: ['tag1'], priorities: ['high'] });
      expect(hasActiveFilters()).toBe(true);

      clearFilters();
      expect(hasActiveFilters()).toBe(false);
      expect(useBoardStore.getState().filters).toEqual({
        tagIds: [],
        assigneeIds: [],
        priorities: [],
      });
    });
  });
});
