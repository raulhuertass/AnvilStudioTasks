import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(nombre: string) {
  const parts = nombre.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserAvatar({
  nombre,
  avatarUrl,
  className,
}: {
  nombre: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-7", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback className="text-[0.65rem] font-medium">{initials(nombre)}</AvatarFallback>
    </Avatar>
  );
}
