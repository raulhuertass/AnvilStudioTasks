import { ListChecksIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubtaskProgress({ done, total }: { done: number; total: number }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 text-xs tabular-nums",
        done === total ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
      )}
      title={`${done} de ${total} subtareas hechas`}
    >
      <ListChecksIcon className="size-3.5" aria-hidden />
      {done}/{total}
    </span>
  );
}
