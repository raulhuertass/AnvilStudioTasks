type DbError = { code?: string; message?: string } | null | undefined;

/** Traduce un error de Supabase a un mensaje para el usuario. */
export function friendlyError(error: DbError, fallback = "No se ha podido completar la acción.") {
  if (!error) return fallback;
  switch (error.code) {
    case "42501":
      return "No tienes permiso para hacer esto.";
    case "23505":
      return "Ya existe un registro con esos datos.";
    case "23503":
      return "Algún dato relacionado ya no existe. Recarga la página.";
    case "PGRST301":
    case "PGRST303":
      return "Tu sesión ha caducado. Vuelve a entrar.";
    case "P0001":
    case "P0002":
    case "22023":
      // Mensajes escritos en español en las funciones de la base de datos.
      return error.message ?? fallback;
    default:
      return error.message === "Failed to fetch"
        ? "No hay conexión con el servidor. Inténtalo de nuevo."
        : fallback;
  }
}
