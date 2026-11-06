"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { FieldSelect } from "@/components/field-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { ALL, EMPTY_FILTERS, UNASSIGNED, type IssueFilters } from "@/lib/filters";
import { PRIORITIES, TYPES } from "@/lib/issue-meta";
import { useWorkspace } from "./workspace-provider";

export function FilterBar() {
  const { members, filters, setFilters, filtersActive } = useWorkspace();

  return (
    <div
      role="search"
      aria-label="Filtrar tareas"
      className="grid grid-cols-2 gap-2 border-b px-4 py-2 sm:flex sm:flex-wrap sm:items-center sm:px-6"
    >
      <div className="relative col-span-2 sm:w-56">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Buscar por texto"
          placeholder="Buscar tareas"
          className="pl-8"
          value={filters.texto}
          onChange={(event) => setFilters({ ...filters, texto: event.target.value })}
        />
      </div>
      <FieldSelect
        label="Filtrar por asignado"
        className="sm:w-44"
        value={filters.asignado}
        options={[
          { value: ALL, label: "Cualquier asignado" },
          { value: UNASSIGNED, label: "Sin asignar" },
          ...[...members]
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((member) => ({
              value: member.user_id,
              label: member.nombre,
              leading: <UserAvatar nombre={member.nombre} avatarUrl={member.avatar_url} className="size-5" />,
            })),
        ]}
        onChange={(asignado) => setFilters({ ...filters, asignado })}
      />
      <FieldSelect
        label="Filtrar por tipo"
        className="sm:w-36"
        value={filters.tipo}
        options={[{ value: ALL, label: "Cualquier tipo" }, ...TYPES]}
        onChange={(tipo) => setFilters({ ...filters, tipo: tipo as IssueFilters["tipo"] })}
      />
      <FieldSelect
        label="Filtrar por prioridad"
        className="sm:w-44"
        value={filters.prioridad}
        options={[{ value: ALL, label: "Cualquier prioridad" }, ...PRIORITIES]}
        onChange={(prioridad) =>
          setFilters({ ...filters, prioridad: prioridad as IssueFilters["prioridad"] })
        }
      />
      {filtersActive && (
        <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
          <XIcon aria-hidden />
          Limpiar
        </Button>
      )}
    </div>
  );
}
