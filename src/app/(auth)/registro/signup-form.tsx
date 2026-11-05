"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, type AuthFormState } from "../actions";

export function SignupForm() {
  const [state, action] = useActionState<AuthFormState, FormData>(signup, {});

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
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" autoComplete="name" maxLength={100} defaultValue={state.nombre} key={state.nombre} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} key={state.email} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">Al menos 8 caracteres.</p>
      </div>
      <SubmitButton className="w-full">Crear cuenta</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Entra
        </Link>
      </p>
    </form>
  );
}
