import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold tracking-tight">Anvil Studio Tasks</p>
        {children}
      </div>
    </div>
  );
}
