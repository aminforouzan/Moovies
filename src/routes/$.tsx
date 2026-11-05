import NotFound from "@/components/NotFound";

/**
 * only matches when no other route does. acts a 404 page for /*
 */
export default function NotFoundRoute() {
  return (
    <>
      <title>صفحه پیدا نشد</title>
      <NotFound />
    </>
  );
}
