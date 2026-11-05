import { LogOutIcon } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { createClient } from "@/lib/supabase/server";

export async function UserMenu() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const nombre = profile?.nombre ?? user.email ?? "Usuario";

  return (
    <div className="flex items-center gap-2">
      <UserAvatar nombre={nombre} avatarUrl={profile?.avatar_url} />
      <span className="hidden max-w-40 truncate text-sm sm:inline">{nombre}</span>
      <form action={logout}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOutIcon />
        </Button>
      </form>
    </div>
  );
}
