import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBoardStore, selectColumns } from "@/stores/useBoardStore";
import { Task } from "@/types";
import { Archive, Trash2, RotateCcw, Trash, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface TrashManagerProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "緊急",
};

const TaskItem: React.FC<{
  task: Task;
  onRestore: () => void;
  onDelete: () => void;
  showDeletedAt?: boolean;
}> = ({ task, onRestore, onDelete, showDeletedAt }) => {
  const columns = useBoardStore(selectColumns);
  const column = columns[task.columnId];

  const timeAgo = useMemo(() => {
    const dateStr = showDeletedAt ? task.deletedAt : task.archivedAt;
    if (!dateStr) return "";
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ja });
  }, [task.deletedAt, task.archivedAt, showDeletedAt]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          {column && (
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              {column.title}
            </span>
          )}
          {timeAgo && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {timeAgo}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestore}
          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
        >
          <RotateCcw size={14} className="mr-1" />
          復元
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash size={14} className="mr-1" />
          削除
        </Button>
      </div>
    </div>
  );
};

const TrashManager: React.FC<TrashManagerProps> = ({ open, onClose }) => {
  const [showEmptyConfirm, setShowEmptyConfirm] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Task | null>(null);

  const archivedTasks = useBoardStore((state) => state.getArchivedTasks());
  const deletedTasks = useBoardStore((state) => state.getDeletedTasks());
  const restoreTask = useBoardStore((state) => state.restoreTask);
  const permanentDeleteTask = useBoardStore((state) => state.permanentDeleteTask);
  const emptyTrash = useBoardStore((state) => state.emptyTrash);

  const handleRestore = (taskId: string) => {
    restoreTask(taskId);
  };

  const handlePermanentDelete = () => {
    if (deleteTarget) {
      permanentDeleteTask(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    setShowEmptyConfirm(false);
  };

  // 削除日時でソート（新しい順）
  const sortedDeletedTasks = useMemo(() => {
    return [...deletedTasks].sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [deletedTasks]);

  const sortedArchivedTasks = useMemo(() => {
    return [...archivedTasks].sort((a, b) => {
      const dateA = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      const dateB = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [archivedTasks]);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] rounded-2xl border-border/50 shadow-apple-xl glass p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Trash2 size={20} />
              ゴミ箱・アーカイブ
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              削除・アーカイブしたタスクを管理します
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="trash" className="flex-1">
            <div className="px-6 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="trash" className="flex-1 flex items-center gap-2">
                  <Trash2 size={14} />
                  ゴミ箱
                  {deletedTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {deletedTasks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archive" className="flex-1 flex items-center gap-2">
                  <Archive size={14} />
                  アーカイブ
                  {archivedTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {archivedTasks.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="trash" className="px-6 pb-6 mt-4">
              {deletedTasks.length > 0 && (
                <div className="flex justify-end mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmptyConfirm(true)}
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    <Trash size={14} className="mr-1" />
                    ゴミ箱を空にする
                  </Button>
                </div>
              )}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedDeletedTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trash2 size={48} className="mx-auto mb-4 opacity-30" />
                    <p>ゴミ箱は空です</p>
                  </div>
                ) : (
                  sortedDeletedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onRestore={() => handleRestore(task.id)}
                      onDelete={() => setDeleteTarget(task)}
                      showDeletedAt
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="archive" className="px-6 pb-6 mt-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedArchivedTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Archive size={48} className="mx-auto mb-4 opacity-30" />
                    <p>アーカイブは空です</p>
                  </div>
                ) : (
                  sortedArchivedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onRestore={() => handleRestore(task.id)}
                      onDelete={() => setDeleteTarget(task)}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ゴミ箱を空にする確認ダイアログ */}
      <AlertDialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              ゴミ箱を空にしますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              この操作は取り消せません。ゴミ箱内の{deletedTasks.length}件のタスクが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl transition-apple">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyTrash}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-apple"
            >
              空にする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 個別削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-apple-xl glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              タスクを完全に削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              この操作は取り消せません。タスク「{deleteTarget?.title}」が完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl transition-apple">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-apple"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TrashManager;
