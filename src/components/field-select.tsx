"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Valor interno para representar null, que Select no admite como opción. */
export const NONE = "__none__";

export type FieldOption = { value: string; label: string };

export function FieldSelect({
  id,
  label,
  value,
  options,
  onChange,
  className,
  size,
  disabled,
}: {
  id?: string;
  label?: string;
  value: string;
  options: FieldOption[];
  onChange: (value: string) => void;
  className?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}) {
  return (
    <Select
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) onChange(next as string);
      }}
    >
      <SelectTrigger id={id} aria-label={label} size={size} className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
