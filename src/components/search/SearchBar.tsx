import React, { useCallback, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
  value,
  onChange,
  placeholder = "タスクを検索...",
  className,
}, ref) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        size={18}
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-10 rounded-full input-apple bg-muted/50 border-border/30"
        aria-label="タスク検索"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-apple rounded-full p-1 hover:bg-muted"
          aria-label="検索をクリア"
          type="button"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

export default React.memo(SearchBar);
