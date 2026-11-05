import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  BugIcon,
  CheckSquareIcon,
  ChevronsUpIcon,
  EqualIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import type { Issue, IssuePriority, IssueStatus, IssueType } from "@/lib/types";

export const STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "por_hacer", label: "Por hacer" },
  { value: "en_curso", label: "En curso" },
  { value: "en_revision", label: "En revisión" },
  { value: "hecho", label: "Hecho" },
];

export const TYPES: { value: IssueType; label: string; icon: LucideIcon; className: string }[] = [
  { value: "bug", label: "Bug", icon: BugIcon, className: "text-red-600 dark:text-red-400" },
  { value: "tarea", label: "Tarea", icon: CheckSquareIcon, className: "text-blue-600 dark:text-blue-400" },
  { value: "historia", label: "Historia", icon: BookmarkIcon, className: "text-green-600 dark:text-green-400" },
  { value: "epica", label: "Épica", icon: ZapIcon, className: "text-purple-600 dark:text-purple-400" },
];

export const PRIORITIES: { value: IssuePriority; label: string; icon: LucideIcon; className: string }[] = [
  { value: "mas_alta", label: "Más alta", icon: ChevronsUpIcon, className: "text-red-600 dark:text-red-400" },
  { value: "alta", label: "Alta", icon: ArrowUpIcon, className: "text-orange-600 dark:text-orange-400" },
  { value: "media", label: "Media", icon: EqualIcon, className: "text-amber-600 dark:text-amber-400" },
  { value: "baja", label: "Baja", icon: ArrowDownIcon, className: "text-blue-600 dark:text-blue-400" },
];

export function typeMeta(value: IssueType) {
  return TYPES.find((item) => item.value === value) ?? TYPES[1];
}

export function priorityMeta(value: IssuePriority) {
  return PRIORITIES.find((item) => item.value === value) ?? PRIORITIES[2];
}

export function issueKey(clave: string, issue: Pick<Issue, "numero">) {
  return `${clave}-${issue.numero}`;
}

export function byPosition(a: Issue, b: Issue) {
  return a.posicion - b.posicion || a.numero - b.numero;
}
