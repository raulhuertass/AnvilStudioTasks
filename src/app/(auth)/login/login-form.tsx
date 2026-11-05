"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type AuthFormState } from "../actions";

const NOTICES: Record<string, string> = {
  confirmacion:
    "No se pudo iniciar la sesión con ese enlace. Si ya has confirmado tu email, entra con tu contraseña.",
};

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const notice = NOTICES[params.get("aviso") ?? ""];
  const [state, action] = useActionState<AuthFormState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {notice && !state.error && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} key={state.email} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton className="w-full">Entrar</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}
