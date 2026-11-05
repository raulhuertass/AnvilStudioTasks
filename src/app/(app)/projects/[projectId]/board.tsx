"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { byPosition, STATUSES } from "@/lib/issue-meta";
import { evenPositions, positionBetween } from "@/lib/positions";
import type { Issue, IssueStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueCardContent, SortableIssueCard } from "./issue-card";
import { useWorkspace } from "./workspace-provider";

type Columns = Record<IssueStatus, string[]>;

function emptyColumns(): Columns {
  return { por_hacer: [], en_curso: [], en_revision: [], hecho: [] };
}

function isStatus(id: unknown): id is IssueStatus {
  return STATUSES.some((status) => status.value === id);
}

function findColumn(columns: Columns, id: unknown): IssueStatus | null {
  if (isStatus(id)) return id;
  return STATUSES.find((status) => columns[status.value].includes(id as string))?.value ?? null;
}

function Column({
  status,
  label,
  issues,
  onOpen,
}: {
  status: IssueStatus;
  label: string;
  issues: Issue[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      aria-label={label}
      className="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-muted/60 md:w-auto md:min-w-0 md:flex-1"
    >
      <h2 className="flex items-center gap-2 px-3 pt-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
        <span className="rounded-full bg-background px-1.5 py-0.5 font-medium tabular-nums">
          {issues.length}
        </span>
      </h2>
      <SortableContext items={issues.map((issue) => issue.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 rounded-b-xl p-2 transition-colors",
            isOver && "bg-accent/60",
          )}
        >
          {issues.map((issue) => (
            <SortableIssueCard key={issue.id} issue={issue} onOpen={() => onOpen(issue.id)} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}

export function Board({ onOpenIssue }: { onOpenIssue: (id: string) => void }) {
  const { project, activeSprint, visibleIssues, updateIssue, updateIssues } = useWorkspace();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Orden provisional mientras se arrastra una tarjeta.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sprintIssues = useMemo(
    () => visibleIssues.filter((issue) => activeSprint && issue.sprint_id === activeSprint.id),
    [visibleIssues, activeSprint],
  );

  const issueById = useMemo(() => new Map(sprintIssues.map((issue) => [issue.id, issue])), [sprintIssues]);

  const savedColumns = useMemo(() => {
    const columns = emptyColumns();
    [...sprintIssues].sort(byPosition).forEach((issue) => columns[issue.estado].push(issue.id));
    return columns;
  }, [sprintIssues]);

  const columns = dragColumns ?? savedColumns;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setDragColumns(savedColumns);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    setDragColumns((current) => {
      if (!current) return current;
      const from = findColumn(current, active.id);
      const to = findColumn(current, over.id);
      if (!from || !to || from === to) return current;
      const overIndex = current[to].indexOf(String(over.id));
      const index = overIndex === -1 ? current[to].length : overIndex;
      return {
        ...current,
        [from]: current[from].filter((id) => id !== active.id),
        [to]: [...current[to].slice(0, index), String(active.id), ...current[to].slice(index)],
      };
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    const current = dragColumns;
    setActiveId(null);
    const id = String(active.id);
    const issue = issueById.get(id);
    if (!over || !current || !issue) {
      setDragColumns(null);
      return;
    }

    const estado = findColumn(current, id);
    if (!estado) {
      setDragColumns(null);
      return;
    }

    let order = current[estado];
    const overIndex = order.indexOf(String(over.id));
    const fromIndex = order.indexOf(id);
    if (overIndex !== -1 && overIndex !== fromIndex) {
      order = arrayMove(order, fromIndex, overIndex);
    }

    const index = order.indexOf(id);
    const unchanged = estado === issue.estado && savedColumns[estado].indexOf(id) === index;
    if (unchanged) {
      setDragColumns(null);
      return;
    }

    const before = issueById.get(order[index - 1])?.posicion;
    const after = issueById.get(order[index + 1])?.posicion;
    const posicion = positionBetween(before, after);

    // Se mantiene el orden provisional hasta aplicar el cambio optimista.
    const saving =
      posicion === null
        ? updateIssues(
            evenPositions(order.length).map((value, position) => ({
              id: order[position],
              patch: order[position] === id ? { posicion: value, estado } : { posicion: value },
            })),
          )
        : updateIssue(id, { estado, posicion });
    setDragColumns(null);
    await saving;
  }

  if (!activeSprint) {
    return (
      <div className="m-4 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center sm:m-6">
        <p className="font-medium">No hay ningún sprint activo</p>
        <p className="text-sm text-muted-foreground">
          Crea un sprint e inícialo desde el backlog para ver aquí su tablero.
        </p>
        <Link href={`/projects/${project.id}/backlog`} className={buttonVariants({ variant: "outline" })}>
          Ir al backlog
        </Link>
      </div>
    );
  }

  const activeIssue = activeId ? issueById.get(activeId) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-medium">{activeSprint.nombre}</h2>
          {activeSprint.fecha_fin && (
            <p className="text-xs text-muted-foreground">Termina el {activeSprint.fecha_fin}</p>
          )}
        </div>
        <CreateIssueDialog sprintId={activeSprint.id} />
      </div>
      <DndContext
        id="kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setDragColumns(null);
        }}
      >
        <div className="flex flex-1 snap-x gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
          {STATUSES.map((status) => (
            <Column
              key={status.value}
              status={status.value}
              label={status.label}
              issues={columns[status.value]
                .map((id) => issueById.get(id))
                .filter((issue): issue is Issue => Boolean(issue))}
              onOpen={onOpenIssue}
            />
          ))}
        </div>
        <DragOverlay>
          {activeIssue && (
            <div className="rounded-lg border bg-card p-3 shadow-lg">
              <IssueCardContent issue={activeIssue} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
