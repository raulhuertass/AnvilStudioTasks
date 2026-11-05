import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { RECOVERY_COOKIE, RECOVERY_PATH } from "@/lib/password-recovery";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

const AUTH_PAGES = ["/login", "/registro"];

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/** Refresca la sesión en cada petición y protege las rutas privadas. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isPublic = isAuthPage || pathname === "/recuperar" || pathname.startsWith("/auth/");

  if (pathname === RECOVERY_PATH && !request.cookies.has(RECOVERY_COOKIE)) {
    const target = request.nextUrl.clone();
    target.pathname = "/recuperar";
    target.search = "";
    target.searchParams.set("aviso", "caducado");
    return redirectWithCookies(target, response);
  }

  if (!user && !isPublic) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = "";
    if (pathname !== "/") {
      target.searchParams.set("next", `${pathname}${search}`);
    }
    return redirectWithCookies(target, response);
  }

  if (user && (isAuthPage || pathname === "/")) {
    const target = request.nextUrl.clone();
    target.pathname = "/projects";
    target.search = "";
    return redirectWithCookies(target, response);
  }

  return response;
}
