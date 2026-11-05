"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { useWorkspace } from "./workspace-provider";

export function ProjectNav() {
  const { project, connectionLost } = useWorkspace();
  const pathname = usePathname();
  const base = `/projects/${project.id}`;
  const links = [
    { href: base, label: "Tablero" },
    { href: `${base}/backlog`, label: "Backlog" },
    { href: `${base}/miembros`, label: "Miembros" },
  ];

  return (
    <>
      <div className="flex flex-col gap-2 border-b px-4 pt-3 sm:px-6">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-lg font-semibold">{project.nombre}</h1>
          <span className="shrink-0 text-xs text-muted-foreground">{project.clave}</span>
          {connectionLost && (
            <span role="status" className="ml-auto shrink-0 text-xs text-amber-600 dark:text-amber-400">
              Reconectando… los cambios de otros pueden tardar en aparecer
            </span>
          )}
        </div>
        <nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Secciones del proyecto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-2 pb-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {pathname !== `${base}/miembros` && <FilterBar />}
    </>
  );
}
