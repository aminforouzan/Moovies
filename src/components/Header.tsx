import { Link, NavLink } from "react-router";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ArchiveSearch } from "@/components/Filters/search/ArchiveSearch";
import { HEADER_SLOT_ID, setHeaderSlot } from "@/lib/headerSlot";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Header() {
  const isDesktop = useMediaQuery("(min-width: 64em)");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      {isDesktop && (
        <div className="mx-auto flex w-full max-w-[1664px] items-center gap-6 px-5 py-4">
          <div className="flex items-center gap-x-6">
            <Link
              to="/"
              className="text-[22px] leading-7 font-bold tracking-tight text-primary select-none"
            >
              Moovies
            </Link>

            <nav className="flex items-center gap-5">
              <NavButton to="/">خانه</NavButton>
              <NavButton to="/archive">آرشیو</NavButton>
              <NavButton to="/about">درباره</NavButton>
            </nav>
          </div>
          <ArchiveSearch variant="desktop" />
          <ThemeToggle className="size-9" />
        </div>
      )}

      {!isDesktop && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 md:px-5">
          <Link
            to="/"
            className="px-1 text-[22px] leading-7 font-bold tracking-tight text-primary select-none"
          >
            Moovies
          </Link>
          <ArchiveSearch variant="mobile" />
          <ThemeToggle className="size-8" />
        </div>
      )}

      <div id={HEADER_SLOT_ID} ref={setHeaderSlot} className="empty:hidden" />
    </header>
  );
}

interface NavButtonProps {
  /** navigation button link text */
  children: string;
  /** navigation button link url */
  to: string;
}

function NavButton({ to, children }: NavButtonProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "border-b-2 pb-0.5 text-lg transition-colors",
          isActive
            ? "border-primary font-semibold text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label="تغییر پوسته"
      onClick={toggleTheme}
      className={cn(
        "rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <MoonIcon className="size-5 dark:hidden" />
      <SunIcon className="hidden size-5 dark:block" />
    </Button>
  );
}
