import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-5">
      <span className="text-[13.5px] font-semibold">{title}</span>
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
}
