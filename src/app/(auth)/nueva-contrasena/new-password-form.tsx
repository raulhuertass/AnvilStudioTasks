"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setRecoveredPassword, type AuthFormState } from "../actions";

export function NewPasswordForm() {
  const [state, action] = useActionState<AuthFormState, FormData>(setRecoveredPassword, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nueva contraseña</Label>
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="repeated">Repite la nueva contraseña</Label>
        <Input
          id="repeated"
          name="repeated"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <SubmitButton className="w-full">Guardar contraseña</SubmitButton>
    </form>
  );
}
