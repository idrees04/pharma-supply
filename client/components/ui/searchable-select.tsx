import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectItem {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    items: SearchableSelectItem[];
    value?: string | number;
    onValueChange: (value: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function SearchableSelect({
    items,
    value,
    onValueChange,
    placeholder = "Select item...",
    searchPlaceholder = "Search...",
    emptyMessage = "No item found.",
    isLoading = false,
    disabled = false,
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);

    const selectedItem = React.useMemo(() => {
        if (value === undefined || value === null || value === "") {
            return undefined;
        }
        return items.find(
            (item) =>
                item.value === value || String(item.value) === String(value)
        );
    }, [items, value]);

    const isItemSelected = (item: SearchableSelectItem) =>
        selectedItem !== undefined &&
        (item.value === selectedItem.value ||
            String(item.value) === String(selectedItem.value));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled || isLoading}
                    className={cn(
                        "w-full justify-between font-normal border-input bg-background shadow-sm transition-all duration-200",
                        "hover:border-primary/50 hover:bg-accent/5",
                        "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        open && "ring-2 ring-primary/20 border-primary",
                        className
                    )}
                >
                    <span className="truncate">{selectedItem ? selectedItem.label : placeholder}</span>
                    {isLoading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                        <ChevronsUpDown className={cn(
                            "ml-2 h-4 w-4 shrink-0 transition-transform duration-200 opacity-50",
                            open && "rotate-180 opacity-100 text-primary"
                        )} />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-full p-0 shadow-lg border-primary/10 animate-in fade-in-0 zoom-in-95 duration-200"
                align="start"
            >
                <Command className="rounded-lg">
                    <CommandInput
                        placeholder={searchPlaceholder}
                        className="h-11 border-none focus:ring-0 placeholder:text-muted-foreground/60"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto px-1 pb-1">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            {emptyMessage}
                        </CommandEmpty>
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={String(item.value)}
                                    value={String(item.value)}
                                    keywords={item.label ? [item.label] : []}
                                    onSelect={() => {
                                        onValueChange(item.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 m-1 px-4 py-3 cursor-pointer rounded-md transition-all duration-200 outline-none",
                                        "aria-selected:bg-sidebar-accent aria-selected:text-sidebar-accent-foreground",
                                        isItemSelected(item)
                                            ? "bg-sidebar-accent/15 text-sidebar-primary font-bold shadow-sm border-l-4 border-l-sidebar-accent pl-3"
                                            : "text-foreground hover:bg-accent/5"
                                    )}
                                >
                                    <span className="flex-1 text-sm leading-tight">{item.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
