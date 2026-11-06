import { issueKey } from "@/lib/issue-meta";
import type { Issue, IssuePriority, IssueType } from "@/lib/types";

export const ALL = "__all__";
export const UNASSIGNED = "__unassigned__";

export type IssueFilters = {
  texto: string;
  asignado: string;
  tipo: IssueType | typeof ALL;
  prioridad: IssuePriority | typeof ALL;
};

export const EMPTY_FILTERS: IssueFilters = {
  texto: "",
  asignado: ALL,
  tipo: ALL,
  prioridad: ALL,
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function hasActiveFilters(filters: IssueFilters) {
  return (
    filters.texto.trim() !== "" ||
    filters.asignado !== ALL ||
    filters.tipo !== ALL ||
    filters.prioridad !== ALL
  );
}

export function matchesFilters(
  issue: Issue,
  assigneeIds: string[],
  filters: IssueFilters,
  clave: string,
) {
  if (filters.tipo !== ALL && issue.tipo !== filters.tipo) return false;
  if (filters.prioridad !== ALL && issue.prioridad !== filters.prioridad) return false;
  if (filters.asignado === UNASSIGNED && assigneeIds.length > 0) return false;
  if (
    filters.asignado !== ALL &&
    filters.asignado !== UNASSIGNED &&
    !assigneeIds.includes(filters.asignado)
  ) {
    return false;
  }

  const texto = normalize(filters.texto.trim());
  if (!texto) return true;
  return [issue.titulo, issue.descripcion ?? "", issueKey(clave, issue)].some((field) =>
    normalize(field).includes(texto),
  );
}
