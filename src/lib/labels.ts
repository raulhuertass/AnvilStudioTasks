export const LABEL_COLORS = [
  { value: "gris", label: "Gris", chip: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", dot: "bg-zinc-400" },
  { value: "rojo", label: "Rojo", chip: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", dot: "bg-red-500" },
  { value: "naranja", label: "Naranja", chip: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", dot: "bg-orange-500" },
  { value: "amarillo", label: "Amarillo", chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", dot: "bg-amber-400" },
  { value: "verde", label: "Verde", chip: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", dot: "bg-green-500" },
  { value: "azul", label: "Azul", chip: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", dot: "bg-blue-500" },
  { value: "morado", label: "Morado", chip: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300", dot: "bg-purple-500" },
  { value: "rosa", label: "Rosa", chip: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300", dot: "bg-pink-500" },
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number]["value"];

export function labelColor(value: string) {
  return LABEL_COLORS.find((color) => color.value === value) ?? LABEL_COLORS[0];
}
