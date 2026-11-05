import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { DirectionProvider } from "@/components/ui/direction";
import "@/App.css";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script>
          {`
            (() => {
              const savedTheme = localStorage.getItem("theme");

              if (savedTheme === "light") return;
              if (savedTheme === "dark") {
                document.documentElement.classList.add("dark");
                return;
              }

              const preferDark = window.matchMedia(
                "(prefers-color-scheme: dark)",
              ).matches;

              if (preferDark) {
                document.documentElement.classList.add("dark");
                localStorage.setItem("theme", "dark");
              }
            })();
          `}
        </script>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta property="og:title" content={siteConfig.englishName} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://moovies.ir/og-picture.png" />
        <meta
          property="og:description"
          content={siteConfig.englishDescription}
        />
        <meta property="og:url" content="https://moovies.ir/" />
        <meta name="theme-color" content="#ff6900" />
        <link rel="icon" type="image/svg+xml" href="/favicon-32x32.png" />
        <title>موویز | دانلود فیلم و سریال</title>
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-svh flex-col">
        <DirectionProvider dir="rtl">
          {children}
          <ScrollRestoration />
          <Scripts />
        </DirectionProvider>
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" aria-label="در حال بارگذاری" />
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-6xl font-bold tracking-tight text-primary">خطا</p>
        <h1 className="text-lg font-semibold">مشکلی پیش آمده</h1>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => window.location.reload()}>
          بارگذاری دوباره
        </Button>
        <Button variant="outline" asChild>
          <a href="/">بازگشت به خانه</a>
        </Button>
      </div>
    </main>
  );
}
