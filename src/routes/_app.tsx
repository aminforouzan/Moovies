import { Outlet } from "react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * Every page that wants the header/footer lives under `_app.*`.
 * Routes outside this branch render without this chrome.
 */
export default function AppLayout() {
  return (
    <>
      <Header />
      <div className="flex flex-1">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
