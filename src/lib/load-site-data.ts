import type { SiteDataFile } from "@/lib/types";

let pending: Promise<SiteDataFile> | null = null;

export function loadSiteData(): Promise<SiteDataFile> {
  if (!pending) {
    pending = import("@/lib/data").then((mod) => mod.default);
  }
  return pending;
}
