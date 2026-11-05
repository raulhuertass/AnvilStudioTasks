import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { CreateProjectDialog } from "./create-project-dialog";

export const metadata: Metadata = { title: "Proyectos · Anvil Studio Tasks" };

async function ProjectList() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, nombre, clave, descripcion")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se han podido cargar tus proyectos. Recarga la página.</AlertDescription>
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">Aún no tienes proyectos</p>
        <p className="text-sm text-muted-foreground">
          Crea el primero o pide que te inviten con tu email.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link href={`/projects/${project.id}`} className="block h-full rounded-xl">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="min-w-0 truncate">{project.nombre}</CardTitle>
                  <Badge variant="secondary">{project.clave}</Badge>
                </div>
                {project.descripcion && (
                  <CardDescription className="line-clamp-2">{project.descripcion}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando proyectos">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Proyectos</h1>
        <CreateProjectDialog />
      </div>
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </main>
  );
}
