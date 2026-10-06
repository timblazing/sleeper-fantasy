"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ResponsiveTabItem = { value: string; label: string };

/** Place inside a controlled Tabs root. Both controls share the parent's selection. */
export function ResponsiveTabs({ items, value, onValueChange, label, mode = "tabs" }: {
  items: readonly ResponsiveTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  mode?: "tabs" | "filter";
}) {
  return (
    <div className="min-w-0 max-md:w-full">
      <div className="md:hidden">
        <Select value={value} onValueChange={(next) => { if (next !== null) onValueChange(next); }}>
          <SelectTrigger aria-label={label} className="w-full">
            <SelectValue>{items.find((item) => item.value === value)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {mode === "filter" ? (
        <div role="group" aria-label={label} className="hidden flex-wrap gap-2 md:flex">
          {items.map((item) => (
            <Button key={item.value} type="button" size="sm" variant={item.value === value ? "secondary" : "outline"} aria-pressed={item.value === value} onClick={() => onValueChange(item.value)}>
              {item.label}
            </Button>
          ))}
        </div>
      ) : (
        <TabsList aria-label={label} className="hidden md:inline-flex">
          {items.map((item) => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}
        </TabsList>
      )}
    </div>
  );
}
