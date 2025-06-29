import { ThemeDropdownMenuButton } from "@/components/ui/theme-dropdown-button";
import { useTheme } from "@/components/ui/theme-provider";

export function Header() {
  const { isDark } = useTheme();
  return (
    <header className="flex items-center justify-between px-4 h-[3.5rem] border-b border-border bg-background">
      <img
        src={isDark ? "/logo-dark.svg" : "/logo.svg"}
        alt="Graplix Logo"
        className="h-6"
      />
      <ThemeDropdownMenuButton />
    </header>
  );
}
