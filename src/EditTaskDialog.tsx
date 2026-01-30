import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { Priority, Task } from "./Kanban";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EditTaskDialog: React.FC<{
  editingTask: Task | null;
  closeEditModal: () => void;
  saveEditedTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}> = ({ editingTask, closeEditModal, saveEditedTask, deleteTask }) => {
  const [task, setTask] = useState(editingTask);

  React.useEffect(() => {
    setTask(editingTask);
  }, [editingTask]);

  if (!task) return null;
  const onDeleteClicked = () => {
    if (task) {
      closeEditModal();
      deleteTask(task.id);
    }
  };

  return (
    <Dialog
      open={!!editingTask}
      onOpenChange={(open) => !open && closeEditModal()}
    >
      <DialogContent>
        <DialogHeader>
          <div className={cn("flex justify-end ")}>
            <DialogTitle>
              Edit Task
              <Trash2 onClick={onDeleteClicked} size={20} className="m-3" />
            </DialogTitle>
          </div>
          <DialogDescription>Change or Check</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveEditedTask(task);
          }}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={task.description}
                onChange={(e) =>
                  setTask({
                    ...task,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(value: Priority) =>
                  setTask({ ...task, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={task.dueDate || ""}
                onChange={(e) =>
                  setTask({
                    ...task,
                    dueDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={task.assignee || ""}
                onChange={(e) =>
                  setTask({
                    ...task,
                    assignee: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
