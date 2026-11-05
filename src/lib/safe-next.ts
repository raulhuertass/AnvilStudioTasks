/** Acepta solo rutas internas para evitar redirecciones abiertas tras el login. */
export function safeNextPath(next: unknown, fallback = "/projects") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
