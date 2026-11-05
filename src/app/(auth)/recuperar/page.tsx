import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecoveryForm } from "./recovery-form";

export const metadata: Metadata = { title: "Recuperar contraseña · Anvil Studio Tasks" };

export default function RecoveryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <RecoveryForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
