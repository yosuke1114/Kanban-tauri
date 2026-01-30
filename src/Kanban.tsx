import React, { useState, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";
import { PlusCircle, Edit2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import EditTaskDialog from "./EditTaskDialog";

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "inProgress" | "done";
  priority: Priority;
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

const Kanban: React.FC = () => {
  const [boardState, setBoardState] = useState<BoardState>(initialBoardState);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("kanbanBoardState");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // バリデーション
        if (parsed.tasks && parsed.columns && parsed.columnOrder) {
          setBoardState(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load board state:", error);
      // デフォルト状態を維持
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("kanbanBoardState", JSON.stringify(boardState));
    } catch (error) {
      console.error("Failed to save board state:", error);
    }
  }, [boardState]);

  // const onDragEnd = (result: DropResult) => {
  //   const { destination, source, draggableId } = result;

  //   if (!destination) {
  //     return;
  //   }

  //   if (
  //     destination.droppableId === source.droppableId &&
  //     destination.index === source.index
  //   ) {
  //     return;
  //   }

  //   const startColumn = boardState.columns[source.droppableId];
  //   const finishColumn = boardState.columns[destination.droppableId];

  //   if (startColumn === finishColumn) {
  //     const newTaskIds = Array.from(startColumn.taskIds);
  //     newTaskIds.splice(source.index, 1);
  //     newTaskIds.splice(destination.index, 0, draggableId);

  //     const newColumn = {
  //       ...startColumn,
  //       taskIds: newTaskIds,
  //     };

  //     const newState = {
  //       ...boardState,
  //       columns: {
  //         ...boardState.columns,
  //         [newColumn.id]: newColumn,
  //       },
  //     };

  //     setBoardState(newState);
  //     return;
  //   }

  //   const startTaskIds = Array.from(startColumn.taskIds);
  //   startTaskIds.splice(source.index, 1);
  //   const newStartColumn = {
  //     ...startColumn,
  //     taskIds: startTaskIds,
  //   };

  //   const finishTaskIds = Array.from(finishColumn.taskIds);
  //   finishTaskIds.splice(destination.index, 0, draggableId);
  //   const newFinishColumn = {
  //     ...finishColumn,
  //     taskIds: finishTaskIds,
  //   };

  //   const newState = {
  //     ...boardState,
  //     columns: {
  //       ...boardState.columns,
  //       [newStartColumn.id]: newStartColumn,
  //       [newFinishColumn.id]: newFinishColumn,
  //     },
  //     tasks: {
  //       ...boardState.tasks,
  //       [draggableId]: {
  //         ...boardState.tasks[draggableId],
  //         status: destination.droppableId as "todo" | "inProgress" | "done",
  //       },
  //     },
  //   };

  //   setBoardState(newState);
  // };

  const addNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: uuidv4(),
        title: newTaskTitle,
        description: "",
        status: "todo",
        priority: "medium",
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
    <div className="container">
      <div className="gap-3">
        <h2 className="font-bold mb-5">Kanban Board</h2>
        <form onSubmit={addNewTask} className="mb-6">
          <div className="">
            <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter new task title"
              className="mr-2"
            />
            {/*
             */}
            <button type="submit">
              <PlusCircle className="mr-2" size={20} />
            </button>
          </div>
        </form>
      </div>
      <div className="row">
        {boardState.columnOrder.map((columnId) => {
          const column = boardState.columns[columnId];
          const tasks = column.taskIds.map(
            (taskId) => boardState.tasks[taskId]
          );

          return (
            <div
              key={column.id}
              className="bg-secondary p-4 rounded-lg border border-primary border-opacity-10"
            >
              <h3 className="text-lg font-semibold mb-4">{column.title}</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="bg-card bg-opacity-90 border border-primary border-opacity-10 rounded-lg p-4 hover:bg-opacity-100 hover:cursor-pointer"
                    onClick={() => openEditModal(task)}
                  >
                    <CardHeader className="pb-2">
                      {/* // title */}
                      <CardTitle className="text-sm">
                        {task.title}
                        <Edit2 onClick={() => openEditModal(task)} size={15} />
                      </CardTitle>
                      {/* // description */}
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{task.description}</CardDescription>
                      <div className="flex justify-between items-center">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-sm text-muted-foreground">
                            Due: {task.dueDate}
                          </span>
                        )}
                      </div>
                      {task.assignee && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Assignee: {task.assignee}
                        </div>
                      )}
                    </CardContent>
                    {/*
                      <CardFooter className="pt-2">
                      <div className="flex justify-end space-x-2 w-full">
                        <Edit2 onClick={() => openEditModal(task)} size={20} />
                      </div>
                    </CardFooter>
*/}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <EditTaskDialog
        editingTask={editingTask}
        closeEditModal={closeEditModal}
        saveEditedTask={saveEditedTask}
        deleteTask={deleteTask}
      />
    </div>
  );
};

export default Kanban;
