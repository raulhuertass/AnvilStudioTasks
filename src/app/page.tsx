import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Anvil Studio Tasks</h1>
      <p className="text-muted-foreground">Gestor de tareas y sprints para equipos.</p>
      <ThemeToggle />
    </main>
  );
}
