import React from "react";
import { Loader2 } from "lucide-react";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";

interface EnumSelectProps {
  items: Array<{ value: number; displayName: string }> | undefined;
  value?: number;
  onValueChange: (value: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function EnumSelect({
  items,
  value,
  onValueChange,
  isLoading = false,
  disabled = false,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className,
}: EnumSelectProps) {
  const selectItems: SearchableSelectItem[] = React.useMemo(
    () =>
      (items ?? []).map((item) => ({
        value: item.value,
        label: item.displayName,
      })),
    [items]
  );

  return (
    <SearchableSelect
      items={selectItems}
      value={value}
      onValueChange={(v) => onValueChange(Number(v))}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      disabled={disabled}
      className={className}
    />
  );
}
