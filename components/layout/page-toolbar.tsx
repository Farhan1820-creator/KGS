"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export type FilterConfig =
  | { type: "search"; key: string; placeholder: string }
  | { type: "select"; key: string; placeholder: string; options: { label: string; value: string }[] };

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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {filters.map((f) =>
          f.type === "search" ? (
            <Input
              key={f.key}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-full sm:w-48"
            />
          ) : (
            <Select
              key={f.key}
              value={values[f.key] || "all"}
              onValueChange={(v) => onChange(f.key, v === "all" ? "" : v ?? "")}
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
          )
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="w-full sm:w-auto">
            Clear
          </Button>
        )}
      </div>
      <div>
        <Button onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
