export const RECOVERY_PATH = "/nueva-contrasena";

/**
 * Marca que la sesión viene de un enlace de recuperación. Sin ella, una sesión
 * abierta cualquiera podría cambiar la contraseña sin saber la actual.
 */
export const RECOVERY_COOKIE = "password_recovery";
export const RECOVERY_COOKIE_MAX_AGE = 60 * 15;
