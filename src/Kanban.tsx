"use client";

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Advanced Kanban Board</h1>
      <form onSubmit={addNewTask} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter new task title"
            className="flex-grow"
          />
          <Button type="submit">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </form>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardState.columnOrder.map((columnId) => {
            const column = boardState.columns[columnId];
            const tasks = column.taskIds.map(
              (taskId) => boardState.tasks[taskId]
            );

            return (
              <div key={column.id} className="bg-secondary p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">{column.title}</h2>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-card"
                            >
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                  {task.title}
                                </CardTitle>
                                <CardDescription>
                                  {task.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
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
                              <CardFooter className="pt-2">
                                <div className="flex justify-end space-x-2 w-full">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditModal(task)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardFooter>
                            </Card>
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
      <EditTaskDialog
        editingTask={editingTask}
        closeEditModal={closeEditModal}
        saveEditedTask={saveEditedTask}
      />
    </div>
  );
};

export default Kanban;
