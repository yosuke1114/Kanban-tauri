import { useBoardStore } from '@/stores/useBoardStore';
import type { Task, Member, Tag, AppState, Board } from '@/types';

/**
 * テスト用のデフォルトボードを作成
 */
export const createMockBoard = (overrides?: Partial<Board>): Board => ({
  id: 'test-board',
  name: 'テストボード',
  description: '',
  tasks: {},
  columns: {
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
  },
  columnOrder: ['todo', 'inProgress', 'done'],
  tags: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * テスト用のタスクを作成
 */
export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: `task-${Date.now()}-${Math.random()}`,
  title: 'テストタスク',
  description: '',
  columnId: 'todo',
  position: 0,
  priority: 'medium',
  assigneeIds: [],
  tagIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sync: {
    version: 1,
    lastModifiedAt: new Date().toISOString(),
    syncStatus: 'local',
  },
  status: 'active',
  ...overrides,
});

/**
 * テスト用のメンバーを作成
 */
export const createMockMember = (overrides?: Partial<Member>): Member => ({
  id: `member-${Date.now()}-${Math.random()}`,
  name: 'テストメンバー',
  color: '#3b82f6',
  isActive: true,
  ...overrides,
});

/**
 * テスト用のタグを作成
 */
export const createMockTag = (overrides?: Partial<Tag>): Tag => ({
  id: `tag-${Date.now()}-${Math.random()}`,
  name: 'テストタグ',
  color: '#10b981',
  ...overrides,
});

/**
 * ストアを初期状態にリセット
 */
export const resetStore = (customBoard?: Partial<Board>) => {
  const board = createMockBoard(customBoard);

  const initialState: Partial<AppState> = {
    boards: {
      [board.id]: board,
    },
    boardOrder: [board.id],
    currentBoardId: board.id,
    members: {},
    currentUserId: undefined,
  };

  useBoardStore.setState(initialState as any);
};

/**
 * ストアにタスクを追加するヘルパー
 */
export const addTaskToStore = (task: Task) => {
  const state = useBoardStore.getState();
  const board = state.boards[state.currentBoardId];
  if (board) {
    useBoardStore.setState({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tasks: {
            ...board.tasks,
            [task.id]: task,
          },
        },
      },
    });
  }
};

/**
 * ストアにメンバーを追加するヘルパー
 */
export const addMemberToStore = (member: Member) => {
  const state = useBoardStore.getState();
  useBoardStore.setState({
    members: {
      ...state.members,
      [member.id]: member,
    },
  });
};

/**
 * ストアにタグを追加するヘルパー
 */
export const addTagToStore = (tag: Tag) => {
  const state = useBoardStore.getState();
  const board = state.boards[state.currentBoardId];
  if (board) {
    useBoardStore.setState({
      boards: {
        ...state.boards,
        [state.currentBoardId]: {
          ...board,
          tags: {
            ...board.tags,
            [tag.id]: tag,
          },
        },
      },
    });
  }
};
