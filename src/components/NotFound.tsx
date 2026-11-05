import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-6xl font-bold tracking-tight text-primary">۴۰۴</p>
        <h1 className="text-lg font-semibold">صفحه پیدا نشد</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          این آدرس وجود نداره یا جا‌به‌جا شده.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link to="/">بازگشت به خانه</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/archive">آرشیو</Link>
        </Button>
      </div>
    </main>
  );
}
