import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "./ColorPicker";

describe("ColorPicker", () => {
  const colors = ["#ef4444", "#f59e0b", "#10b981"] as const;

  it("すべてのカラーオプションが表示される", () => {
    render(
      <ColorPicker
        colors={colors}
        selectedColor={colors[0]}
        onColorChange={vi.fn()}
      />
    );

    colors.forEach((color) => {
      expect(screen.getByTestId(`color-option-${color}`)).toBeInTheDocument();
    });
  });

  it("選択されたカラーにborder-primaryクラスが適用される", () => {
    render(
      <ColorPicker
        colors={colors}
        selectedColor={colors[1]}
        onColorChange={vi.fn()}
      />
    );

    const selectedButton = screen.getByTestId(`color-option-${colors[1]}`);
    expect(selectedButton).toHaveClass("border-primary");
  });

  it("カラーをクリックするとonColorChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onColorChange = vi.fn();

    render(
      <ColorPicker
        colors={colors}
        selectedColor={colors[0]}
        onColorChange={onColorChange}
      />
    );

    await user.click(screen.getByTestId(`color-option-${colors[1]}`));
    expect(onColorChange).toHaveBeenCalledWith(colors[1]);
  });

  it("カスタムtestIdPrefixが適用される", () => {
    render(
      <ColorPicker
        colors={colors}
        selectedColor={colors[0]}
        onColorChange={vi.fn()}
        testIdPrefix="custom"
      />
    );

    expect(screen.getByTestId(`custom-option-${colors[0]}`)).toBeInTheDocument();
  });

  it("各カラーボタンにbackgroundColorが設定される", () => {
    render(
      <ColorPicker
        colors={colors}
        selectedColor={colors[0]}
        onColorChange={vi.fn()}
      />
    );

    colors.forEach((color) => {
      const button = screen.getByTestId(`color-option-${color}`);
      expect(button).toHaveStyle({ backgroundColor: color });
    });
  });
});
