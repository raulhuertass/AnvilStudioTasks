import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">No encontrado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Esta página no existe o no tienes acceso a ella.
      </p>
      <Link href="/projects" className={buttonVariants()}>
        Ir a mis proyectos
      </Link>
    </main>
  );
}
