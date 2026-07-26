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
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((f) =>
          f.type === "search" ? (
            <Input
              key={f.key}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-48"
            />
          ) : (
            <Select key={f.key} value={values[f.key] ?? ""} onValueChange={(v) => onChange(f.key, v ?? "")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={f.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
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
