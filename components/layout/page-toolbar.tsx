"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export type FilterConfig =
  | { type: "search"; key: string; placeholder: string; label?: string }
  | { type: "select"; key: string; placeholder: string; options: { label: string; value: string }[]; label?: string };

interface PageToolbarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onAdd: () => void;
  addLabel: string;
}

export function PageToolbar({ filters, values, onChange, onAdd, addLabel }: PageToolbarProps) {
  const hasActiveFilters = filters.some((f) => (values[f.key] ?? "") !== "");

  function handleClear() {
    filters.forEach((f) => onChange(f.key, ""));
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      {/* Filters Group */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-3.5 flex-1">
        {filters.map((f) => {
          const labelText = f.label || f.placeholder;
          return (
            <div key={f.key} className="space-y-1.5 w-full sm:w-auto min-w-0">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                {labelText}
              </Label>
              {f.type === "search" ? (
                <Input
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="w-full sm:w-56"
                />
              ) : (
                <Select
                  value={values[f.key] || "all"}
                  onValueChange={(v: string | null) => onChange(f.key, v === "all" ? "" : v ?? "")}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder={f.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}

        {hasActiveFilters && (
          <div className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="default"
              onClick={handleClear}
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground h-10 px-3"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="w-full lg:w-auto shrink-0 flex items-end">
        <Button onClick={onAdd} size="default" className="w-full sm:w-auto shadow-xs h-10">
          <Plus className="h-4 w-4 mr-1.5" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
