"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { RECOVERY_COOKIE, RECOVERY_PATH } from "@/lib/password-recovery";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; message?: string; email?: string; nombre?: string };

function authErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Confirma tu email antes de entrar. Revisa tu bandeja de entrada.";
    case "weak_password":
      return "La contraseña es demasiado débil. Usa al menos 8 caracteres.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    case "email_address_invalid":
      return "Ese email no es válido.";
    case "signup_disabled":
      return "El registro está desactivado.";
    default:
      return fallback;
  }
}

export async function login(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu email y tu contraseña.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: authErrorMessage(error.code, "No se pudo iniciar sesión. Inténtalo de nuevo."), email };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signup(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nombre) return { error: "Escribe tu nombre.", email };
  if (!email) return { error: "Escribe tu email.", nombre };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres.", email, nombre };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });
  if (error) {
    return {
      error: authErrorMessage(error.code, "No se pudo crear la cuenta. Inténtalo de nuevo."),
      email,
      nombre,
    };
  }

  // Con la confirmación de email desactivada, signUp ya devuelve sesión.
  if (data.session) redirect("/projects");

  return { message: "Te hemos enviado un email. Ábrelo para confirmar tu cuenta y poder entrar." };
}

export async function requestPasswordReset(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu email." };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/callback?next=${RECOVERY_PATH}` : undefined,
  });

  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { error: authErrorMessage(error.code, ""), email };
  }
  if (error?.code === "email_address_invalid" || error?.code === "validation_failed") {
    return { error: "Ese email no es válido.", email };
  }
  if (error && error.status && error.status >= 500) {
    return { error: "No se ha podido enviar el email. Inténtalo más tarde.", email };
  }

  // Misma respuesta exista o no la cuenta, para no revelar qué emails están registrados.
  return {
    message:
      "Si hay una cuenta con ese email, te hemos enviado un enlace. Ábrelo en este mismo navegador para elegir una contraseña nueva.",
  };
}

export async function setRecoveredPassword(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const repeated = String(formData.get("repeated") ?? "");

  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== repeated) return { error: "Las dos contraseñas no coinciden." };

  const cookieStore = await cookies();
  if (!cookieStore.has(RECOVERY_COOKIE)) redirect("/recuperar?aviso=caducado");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "La nueva contraseña debe ser distinta de la anterior."
          : authErrorMessage(error.code, "No se ha podido guardar la contraseña. Inténtalo de nuevo."),
    };
  }

  // La recuperación puede deberse a un acceso ajeno: se cierran las demás sesiones.
  await supabase.auth.signOut({ scope: "others" });
  cookieStore.delete(RECOVERY_COOKIE);
  redirect("/projects");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
