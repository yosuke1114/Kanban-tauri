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

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({ open, onOpenChange, onConfirm, title, description }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg border-border/50 shadow-apple-xl glass">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md transition-apple">
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-apple"
          >
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
