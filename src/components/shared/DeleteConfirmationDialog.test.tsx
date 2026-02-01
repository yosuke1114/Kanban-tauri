import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

describe("DeleteConfirmationDialog", () => {
  it("openがtrueの時にダイアログが表示される", () => {
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="削除確認"
        description="この操作は取り消せません"
      />
    );

    expect(screen.getByText("削除確認")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();
  });

  it("openがfalseの時にダイアログが表示されない", () => {
    render(
      <DeleteConfirmationDialog
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="削除確認"
        description="この操作は取り消せません"
      />
    );

    expect(screen.queryByText("削除確認")).not.toBeInTheDocument();
  });

  it("削除ボタンをクリックするとonConfirmが呼ばれる", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        title="削除確認"
        description="この操作は取り消せません"
      />
    );

    await user.click(screen.getByText("削除"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("キャンセルボタンが表示される", () => {
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="削除確認"
        description="この操作は取り消せません"
      />
    );

    expect(screen.getByText("キャンセル")).toBeInTheDocument();
  });

  it("カスタムのタイトルと説明が表示される", () => {
    render(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="タスクを削除"
        description="タスク「テスト」を削除します"
      />
    );

    expect(screen.getByText("タスクを削除")).toBeInTheDocument();
    expect(screen.getByText("タスク「テスト」を削除します")).toBeInTheDocument();
  });
});
