interface ColorPickerProps {
  colors: readonly string[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  testIdPrefix?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onColorChange,
  testIdPrefix = "color",
}) => {
  return (
    <div className="flex gap-2">
      {colors.map((color) => (
        <button
          key={color}
          data-testid={`${testIdPrefix}-option-${color}`}
          className={`w-6 h-6 rounded-full border-2 transition-all ${
            selectedColor === color
              ? "border-primary scale-110"
              : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onColorChange(color)}
          aria-label={`カラー ${color}`}
        />
      ))}
    </div>
  );
};
