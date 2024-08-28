"use client";

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";

type Task = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "inProgress" | "done";
  dueDate?: string;
  assignee?: string;
};

type Column = {
  id: "todo" | "inProgress" | "done";
  title: string;
  taskIds: string[];
};

type BoardState = {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
};

const initialBoardState: BoardState = {
  tasks: {},
  columns: {
    todo: { id: "todo", title: "To Do", taskIds: [] },
    inProgress: { id: "inProgress", title: "In Progress", taskIds: [] },
    done: { id: "done", title: "Done", taskIds: [] },
  },
  columnOrder: ["todo", "inProgress", "done"],
};

const KanbanBoard: React.FC = () => {
  const [boardState, setBoardState] = useState<BoardState>(initialBoardState);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const savedState = localStorage.getItem("kanbanBoardState");
    if (savedState) {
      setBoardState(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("kanbanBoardState", JSON.stringify(boardState));
  }, [boardState]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = boardState.columns[source.droppableId];
    const finishColumn = boardState.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      const newState = {
        ...boardState,
        columns: {
          ...boardState.columns,
          [newColumn.id]: newColumn,
        },
      };

      setBoardState(newState);
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinishColumn = {
      ...finishColumn,
      taskIds: finishTaskIds,
    };

    const newState = {
      ...boardState,
      columns: {
        ...boardState.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
      tasks: {
        ...boardState.tasks,
        [draggableId]: {
          ...boardState.tasks[draggableId],
          status: destination.droppableId as "todo" | "inProgress" | "done",
        },
      },
    };

    setBoardState(newState);
  };

  const addNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: uuidv4(),
        title: newTaskTitle,
        description: "",
        status: "todo",
      };
      const newState = {
        ...boardState,
        tasks: {
          ...boardState.tasks,
          [newTask.id]: newTask,
        },
        columns: {
          ...boardState.columns,
          todo: {
            ...boardState.columns.todo,
            taskIds: [...boardState.columns.todo.taskIds, newTask.id],
          },
        },
      };
      setBoardState(newState);
      setNewTaskTitle("");
    }
  };

  const deleteTask = (taskId: string) => {
    const { [taskId]: deletedTask, ...remainingTasks } = boardState.tasks;
    const newColumns = { ...boardState.columns };
    Object.keys(newColumns).forEach((columnId) => {
      newColumns[columnId] = {
        ...newColumns[columnId],
        taskIds: newColumns[columnId].taskIds.filter((id) => id !== taskId),
      };
    });
    setBoardState({
      ...boardState,
      tasks: remainingTasks,
      columns: newColumns,
    });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
  };

  const closeEditModal = () => {
    setEditingTask(null);
  };

  const saveEditedTask = (editedTask: Task) => {
    setBoardState({
      ...boardState,
      tasks: {
        ...boardState.tasks,
        [editedTask.id]: editedTask,
      },
    });
    closeEditModal();
  };

  return (
    <div className="kanban-board">
      <h1>Kanban</h1>
      <form onSubmit={addNewTask} className="add-task-form">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter new task title"
          className="input"
        />
        <button type="submit" className="button">
          Add Task
        </button>
      </form>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-columns">
          {boardState.columnOrder.map((columnId) => {
            const column = boardState.columns[columnId];
            const tasks = column.taskIds.map(
              (taskId) => boardState.tasks[taskId]
            );

            return (
              <div key={column.id} className="board-column">
                <h2>{column.title}</h2>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="task-list"
                    >
                      {tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                            >
                              <h3>{task.title}</h3>
                              <p>{task.description}</p>
                              {task.dueDate && <p>Due: {task.dueDate}</p>}
                              {task.assignee && (
                                <p>Assignee: {task.assignee}</p>
                              )}
                              <div className="task-actions">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="button edit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="button delete"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={saveEditedTask}
          onClose={closeEditModal}
        />
      )}
      <style jsx>{`
        .kanban-board {
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .board-columns {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }
        .board-column {
          flex: 1;
          min-width: 250px;
          color: black;
          font-weight: bold;

          background-color: #f4f5f7;
          border-radius: 5px;
          padding: 10px;
        }
        .task-list {
          min-height: 100px;
        }
        .task-card {
          background-color: white;
          border-radius: 3px;
          box-shadow: 0 1px 0 rgba(9, 30, 66, 0.25);
          padding: 10px;
          margin-bottom: 10px;
        }
        .task-actions {
          display: flex;
          justify-content: flex-end;
          gap: 5px;
          margin-top: 10px;
        }
        .add-task-form {
          margin-bottom: 20px;
        }
        .input {
          padding: 5px;
          margin-right: 10px;
        }
        .button {
          background-color: #0052cc;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }
        .button:hover {
          background-color: #0065ff;
        }
        .button.edit {
          background-color: #00a3bf;
        }
        .button.delete {
          background-color: #de350b;
        }
        @media (max-width: 768px) {
          .board-columns {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

type EditTaskModalProps = {
  task: Task;
  onSave: (task: Task) => void;
  onClose: () => void;
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  onSave,
  onClose,
}) => {
  const [editedTask, setEditedTask] = useState(task);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedTask);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Task</h2>
        <form onSubmit={handleSave}>
          <div>
            <label htmlFor="title">Title:</label>
            <input
              id="title"
              type="text"
              value={editedTask.title}
              onChange={(e) =>
                setEditedTask({ ...editedTask, title: e.target.value })
              }
              className="input"
            />
          </div>
          <div>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={editedTask.description}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              className="textarea"
            />
          </div>
          <div>
            <label htmlFor="dueDate">Due Date:</label>
            <input
              id="dueDate"
              type="date"
              value={editedTask.dueDate || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, dueDate: e.target.value })
              }
              className="input"
            />
          </div>
          <div>
            <label htmlFor="assignee">Assignee:</label>
            <input
              id="assignee"
              type="text"
              value={editedTask.assignee || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, assignee: e.target.value })
              }
              className="input"
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="button">
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="button secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal {
          background-color: white;
          color: black;
          padding: 20px;
          border-radius: 5px;
          width: 90%;
          max-width: 500px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .input {
          width: 100%;

          background-color: #f4f5f7;
          color: black;
        }
        .textarea {
          width: 100%;
          padding: 5px;
          margin-bottom: 10px;
        }
        .button {
          background-color: #0052cc;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }
        .button.secondary {
          background-color: #f4f5f7;
          color: #172b4d;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
