"use client";

import { Loader2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function updateErrorMessage(code: string | undefined) {
  switch (code) {
    case "same_password":
      return "La nueva contraseña debe ser distinta de la actual.";
    case "weak_password":
      return "La contraseña es demasiado débil. Usa al menos 8 caracteres.";
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    default:
      return "No se ha podido cambiar la contraseña. Inténtalo de nuevo.";
  }
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeated, setRepeated] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (next !== repeated) {
      setError("Las dos contraseñas nuevas no coinciden.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      setSaving(false);
      setError("Tu sesión ha caducado. Vuelve a entrar.");
      return;
    }

    // Comprueba la contraseña actual para que una sesión abierta no baste para cambiarla.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (verifyError) {
      setSaving(false);
      setError(
        verifyError.code === "invalid_credentials"
          ? "La contraseña actual no es correcta."
          : updateErrorMessage(verifyError.code),
      );
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (updateError) {
      setError(updateErrorMessage(updateError.code));
      return;
    }

    setCurrent("");
    setNext("");
    setRepeated("");
    toast.success("Contraseña cambiada.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={next}
          onChange={(event) => setNext(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Al menos 8 caracteres.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="repeat-password">Repite la nueva contraseña</Label>
        <Input
          id="repeat-password"
          type="password"
          autoComplete="new-password"
          required
          value={repeated}
          onChange={(event) => setRepeated(event.target.value)}
        />
      </div>
      <div>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2Icon className="animate-spin" aria-hidden />}
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}
