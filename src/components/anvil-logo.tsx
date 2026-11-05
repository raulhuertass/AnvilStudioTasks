import { cn } from "@/lib/utils";

/** Símbolo de Anvil Studio. Toma el color del texto: negro en modo claro y blanco en oscuro. */
export function AnvilLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="186 34 292 291"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5 shrink-0 text-black dark:text-white", className)}
    >
      <g transform="translate(13 38)">
        <path d="M177,283L289,283C297,268 306,249 313,232C305,214 287,204 267,204C239,204 216,217 202,238C192,254 184,271 177,283Z" />
        <path d="M318,0L461,283L350,283C339,261 327,240 316,221C304,200 295,179 289,156C282,131 281,106 285,84C289,60 297,37 308,18C312,11 315,5 318,0Z" />
      </g>
    </svg>
  );
}
