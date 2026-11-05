"use client";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold">Algo ha ido mal</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        No se ha podido cargar esta página. Comprueba tu conexión y vuelve a intentarlo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
