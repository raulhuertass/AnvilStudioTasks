import Link from "next/link";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
        <Link href="/projects" className="truncate font-semibold tracking-tight">
          Anvil Studio Tasks
        </Link>
        <div className="flex items-center gap-1">
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
