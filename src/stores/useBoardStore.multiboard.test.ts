import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBoardStore } from "./useBoardStore";

describe("useBoardStore - マルチボード機能", () => {
  beforeEach(() => {
    // ストアをリセット
    useBoardStore.setState({
      boards: {
        main: {
          id: "main",
          name: "メインボード",
          tasks: {},
          columns: {
            todo: {
              id: "todo",
              title: "未着手",
              isDefault: true,
            },
          },
          columnOrder: ["todo"],
          members: {},
          tags: {},
          createdAt: Date.now(),
        },
        board2: {
          id: "board2",
          name: "ボード2",
          tasks: {},
          columns: {
            todo: {
              id: "todo",
              title: "未着手",
              isDefault: true,
            },
          },
          columnOrder: ["todo"],
          members: {},
          tags: {},
          createdAt: Date.now(),
        },
      },
      currentBoardId: "main",
      boardOrder: ["main", "board2"],
      filters: { tagIds: [], assigneeIds: [], priorities: [] },
      searchQuery: "",
    });

    // localStorageをモック
    vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
  });

  it("switchBoardがcurrentBoardIdを正しく変更する", () => {
    const { switchBoard } = useBoardStore.getState();

    switchBoard("board2");

    const state = useBoardStore.getState();
    expect(state.currentBoardId).toBe("board2");
  });

  it("switchBoard後にsaveToStorageが呼ばれる", () => {
    const { switchBoard } = useBoardStore.getState();

    switchBoard("board2");

    // localStorageのsetItemが呼ばれたことを確認
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "kanbanBoardState",
      expect.any(String)
    );
  });

  it("ボード切り替え後にaddTaskが正しいボードにタスクを追加する", () => {
    const { switchBoard, addTask } = useBoardStore.getState();

    // ボード2に切り替え
    switchBoard("board2");

    // タスクを追加
    const taskId = addTask("todo", "テストタスク", false);

    const state = useBoardStore.getState();
    const board2Tasks = state.boards["board2"].tasks;
    const mainTasks = state.boards["main"].tasks;

    // ボード2にタスクが追加されている
    expect(board2Tasks[taskId]).toBeDefined();
    expect(board2Tasks[taskId].title).toBe("テストタスク");

    // メインボードには追加されていない
    expect(mainTasks[taskId]).toBeUndefined();
  });

  it("ボード切り替え後にフィルターがリセットされる", () => {
    const { switchBoard } = useBoardStore.getState();

    // フィルターを設定
    useBoardStore.setState({
      filters: {
        tagIds: ["tag1"],
        assigneeIds: ["member1"],
        priorities: ["high"],
      },
      searchQuery: "検索ワード",
    });

    // ボード切り替え
    switchBoard("board2");

    const state = useBoardStore.getState();

    // フィルターがリセットされている
    expect(state.filters).toEqual({
      tagIds: [],
      assigneeIds: [],
      priorities: [],
    });
    expect(state.searchQuery).toBe("");
  });

  it("存在しないボードIDでswitchBoardを呼んでも状態が変わらない", () => {
    const { switchBoard } = useBoardStore.getState();
    const beforeState = useBoardStore.getState();

    switchBoard("nonexistent");

    const afterState = useBoardStore.getState();
    expect(afterState.currentBoardId).toBe(beforeState.currentBoardId);
  });

  it("ボード切り替え後にupdateTaskが現在のボードのタスクを更新する", () => {
    const { switchBoard, addTask, updateTask } = useBoardStore.getState();

    // メインボードにタスクを追加
    const taskId = addTask("todo", "メインタスク", false);

    // タスクを更新（メインボードで）
    updateTask(taskId, { title: "更新されたタスク" });

    const state = useBoardStore.getState();
    const mainTasks = state.boards["main"].tasks;

    // メインボードのタスクが更新されている
    expect(mainTasks[taskId].title).toBe("更新されたタスク");

    // ボード2に切り替え
    switchBoard("board2");

    // ボード2にタスクを追加
    const board2TaskId = addTask("todo", "ボード2タスク", false);

    // ボード2のタスクを更新
    updateTask(board2TaskId, { title: "更新されたボード2タスク" });

    const stateAfter = useBoardStore.getState();
    const board2Tasks = stateAfter.boards["board2"].tasks;

    // ボード2のタスクが更新されている
    expect(board2Tasks[board2TaskId].title).toBe("更新されたボード2タスク");
  });

  it("ボード切り替え後にdeleteTaskが現在のボードのタスクを削除する", () => {
    const { switchBoard, addTask, deleteTask } = useBoardStore.getState();

    // メインボードにタスクを追加
    const taskId = addTask("todo", "削除されるタスク", false);

    // メインボードでタスクを削除
    deleteTask(taskId);

    const state = useBoardStore.getState();
    const mainTasks = state.boards["main"].tasks;

    // メインボードからタスクが削除されている
    expect(mainTasks[taskId]).toBeUndefined();

    // ボード2に切り替え
    switchBoard("board2");

    // ボード2にタスクを追加
    const board2TaskId = addTask("todo", "削除されるボード2タスク", false);

    // ボード2のタスクを削除
    deleteTask(board2TaskId);

    const stateAfter = useBoardStore.getState();
    const board2Tasks = stateAfter.boards["board2"].tasks;

    // ボード2からタスクが削除されている
    expect(board2Tasks[board2TaskId]).toBeUndefined();
  });

  it("カスタム列を持つボードでタスクを追加すると最初の列に追加される", () => {
    // カスタム列を持つボードを作成
    useBoardStore.setState({
      boards: {
        main: {
          id: "main",
          name: "メインボード",
          tasks: {},
          columns: {
            backlog: {
              id: "backlog",
              title: "バックログ",
              isDefault: false,
            },
            inProgress: {
              id: "inProgress",
              title: "進行中",
              isDefault: false,
            },
            done: {
              id: "done",
              title: "完了",
              isDefault: false,
            },
          },
          columnOrder: ["backlog", "inProgress", "done"],
          members: {},
          tags: {},
          createdAt: Date.now(),
        },
      },
      currentBoardId: "main",
      boardOrder: ["main"],
      filters: { tagIds: [], assigneeIds: [], priorities: [] },
      searchQuery: "",
    });

    const { addTask } = useBoardStore.getState();
    const state = useBoardStore.getState();
    const firstColumnId = state.boards[state.currentBoardId].columnOrder[0];

    // 最初の列（backlog）にタスクを追加
    const taskId = addTask(firstColumnId, "カスタムボードのタスク", false);

    const updatedState = useBoardStore.getState();
    const task = updatedState.boards["main"].tasks[taskId];

    // タスクが最初の列（backlog）に追加されている
    expect(task).toBeDefined();
    expect(task.columnId).toBe("backlog");
    expect(task.title).toBe("カスタムボードのタスク");
  });
});
