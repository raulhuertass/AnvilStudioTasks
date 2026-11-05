"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type AuthFormState } from "../actions";

const NOTICES: Record<string, string> = {
  enlace:
    "El enlace no es válido o ha caducado. Pide otro y ábrelo en este mismo navegador.",
  caducado: "El tiempo para cambiar la contraseña ha caducado. Pide un enlace nuevo.",
};

export function RecoveryForm() {
  const notice = NOTICES[useSearchParams().get("aviso") ?? ""];
  const [state, action] = useActionState<AuthFormState, FormData>(requestPasswordReset, {});

  if (state.message) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <Link className="text-center text-sm font-medium underline underline-offset-4" href="/login">
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {notice && !state.error && (
        <Alert variant="destructive">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-muted-foreground">
        Escribe tu email y te enviaremos un enlace para elegir una contraseña nueva.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          key={state.email}
          required
        />
      </div>
      <SubmitButton className="w-full">Enviar enlace</SubmitButton>
      <Link className="text-center text-sm font-medium underline underline-offset-4" href="/login">
        Volver a entrar
      </Link>
    </form>
  );
}
