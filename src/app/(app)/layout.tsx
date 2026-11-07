import Link from "next/link";
import { Suspense } from "react";
import { AnvilLogo } from "@/components/anvil-logo";
import { InstallAppButton } from "@/components/install-app-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
        <Link href="/projects" className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
          <AnvilLogo />
          <span className="truncate">Anvil Studio Tasks</span>
        </Link>
        <div className="flex items-center gap-1">
          <InstallAppButton />
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="size-7 rounded-full" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
