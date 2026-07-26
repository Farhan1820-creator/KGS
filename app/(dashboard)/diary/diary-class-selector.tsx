"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiaryClassSelectorProps {
  classes: { id: number; name: string }[];
  selectedClassId: string;
}

export function DiaryClassSelector({ classes, selectedClassId }: DiaryClassSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", value);
    router.push(`/diary?${params.toString()}`);
  }

  return (
    <Select value={selectedClassId} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select class" />
      </SelectTrigger>
      <SelectContent>
        {classes.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}