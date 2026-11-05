import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nueva contraseña · Anvil Studio Tasks" };

// El proxy solo deja llegar aquí con la marca de recuperación.
export default function NewPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Elige una contraseña nueva</CardTitle>
      </CardHeader>
      <CardContent>
        <NewPasswordForm />
      </CardContent>
    </Card>
  );
}
