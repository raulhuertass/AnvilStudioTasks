import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_MAX_AGE,
  RECOVERY_PATH,
} from "@/lib/password-recovery";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/** Destino de los enlaces de confirmación de email y de recuperación de contraseña. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const isRecovery = next === RECOVERY_PATH;
  const target = request.nextUrl.clone();
  target.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isRecovery) {
        (await cookies()).set(RECOVERY_COOKIE, "1", {
          httpOnly: true,
          secure: request.nextUrl.protocol === "https:",
          sameSite: "lax",
          path: "/",
          maxAge: RECOVERY_COOKIE_MAX_AGE,
        });
      }
      target.pathname = next;
      return NextResponse.redirect(target);
    }
  }

  if (isRecovery) {
    target.pathname = "/recuperar";
    target.searchParams.set("aviso", "enlace");
    return NextResponse.redirect(target);
  }

  // Abrir el enlace en otro navegador confirma el email pero no crea sesión.
  target.pathname = "/login";
  target.searchParams.set("aviso", "confirmacion");
  return NextResponse.redirect(target);
}
