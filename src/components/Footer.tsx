import { NavLink } from "react-router";
import { ArrowUp, Home, Info, Library, type LucideIcon } from "lucide-react";
import { siGithub } from "simple-icons";
import { cn, formatPersianDate } from "@/lib/utils";
import data from "@/lib/data";
import { siteConfig } from "@/config/site";

export function Footer() {
  const lastUpdated = formatPersianDate(data.meta.last_updated);
  return (
    <>
      {/* desktop */}
      <footer className="w-full border-t bg-background text-muted-foreground">
        <div className="mx-auto w-full max-w-[1664px] px-3 lg:px-4">
          <div className="flex flex-row items-center justify-between gap-3 py-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:text-right">
              <span>آخرین به‌روزرسانی: {lastUpdated}</span>
              <span aria-hidden="true" className="text-muted-foreground/40">
                •
              </span>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-3.5 fill-current"
                >
                  <path d={siGithub.path} />
                </svg>
                <span>گیت‌هاب</span>
              </a>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex items-center gap-1 font-medium transition-colors hover:text-primary"
            >
              <span>بازگشت به بالا</span>
              <ArrowUp
                aria-hidden="true"
                className="size-3.5 transition-transform group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>
      </footer>

      {/* mobile */}
      <div className="block lg:hidden">
        <div aria-hidden="true" className="h-16" />
        <nav
          aria-label="ناوبری اصلی"
          className="fixed bottom-0 z-50 w-full border-t bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl"
        >
          <div className="flex h-16 items-center justify-around px-3">
            <BottomNavLink to="/" icon={Home}>
              خانه
            </BottomNavLink>
            <BottomNavLink to="/archive" icon={Library}>
              آرشیو
            </BottomNavLink>
            <BottomNavLink to="/about" icon={Info}>
              درباره
            </BottomNavLink>
          </div>
        </nav>
      </div>
    </>
  );
}

interface BottomNavLinkProps {
  /** navigation button link url */
  to: string;
  /** icon shown above the label */
  icon: LucideIcon;
  /** navigation button link text */
  children: string;
}

function BottomNavLink({ to, icon: Icon, children }: BottomNavLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
          isActive
            ? "font-semibold text-primary"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      <Icon aria-hidden="true" className="size-[22px]" />
      <span>{children}</span>
    </NavLink>
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
