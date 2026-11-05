import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Crear cuenta · Anvil Studio Tasks" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
