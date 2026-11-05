import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Mi cuenta · Anvil Studio Tasks" };

export default function AccountPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Mi cuenta</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
