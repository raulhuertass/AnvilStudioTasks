import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Anvil Studio Tasks" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-52 w-full" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
