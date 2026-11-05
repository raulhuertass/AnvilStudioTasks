import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/** Destino del enlace de confirmación del email. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const target = request.nextUrl.clone();
  target.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      target.pathname = next;
      return NextResponse.redirect(target);
    }
  }

  // Abrir el enlace en otro navegador confirma el email pero no crea sesión.
  target.pathname = "/login";
  target.searchParams.set("aviso", "confirmacion");
  return NextResponse.redirect(target);
}
