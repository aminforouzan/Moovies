import { Captions, Headset, Languages, type LucideIcon } from "lucide-react";
import { MovieDownloadLinks } from "@/components/title-detail/MovieDownloadLinks";
import { SeriesDownloadLinks } from "@/components/title-detail/SeriesDownloadLinks";
import { TitleHero } from "@/components/title-detail/TitleHero";
import type { LinkType } from "@/lib/title-links";
import type { TitleDetails, TitleRecord } from "@/lib/types";

interface GroupLook {
  title: string;
  Icon: LucideIcon;
  iconClass: string;
  circleClass: string;
}

export const GROUPS: Record<LinkType, GroupLook> = {
  dub: {
    title: "دوبله فارسی دو زبانه",
    Icon: Headset,
    iconClass: "text-primary",
    circleClass: "bg-primary/10 text-primary",
  },
  sub: {
    title: "زیرنویس فارسی (Softsub)",
    Icon: Captions,
    iconClass: "text-sky-600 dark:text-sky-400",
    circleClass: "bg-secondary/60 text-secondary-foreground",
  },
  nosub: {
    title: "زبان اصلی",
    Icon: Languages,
    iconClass: "text-muted-foreground",
    circleClass: "bg-muted text-muted-foreground",
  },
};

interface TitleDetailsPageProps {
  record: TitleRecord;
  details: TitleDetails;
}

/**
 * The whole main content of /titles/:imdbCode. The page background, header and
 * footer come from the `_app` layout; this only paints the main column.
 */
export function TitleDetailsPage({ record, details }: TitleDetailsPageProps) {
  return (
    <main className="w-full">
      <div className="mx-auto flex w-full max-w-250 flex-col gap-6 px-3 py-6 md:px-4 md:py-8">
        <TitleHero record={record} details={details} />

        {details.title_type === "series" ? (
          <SeriesDownloadLinks links={details.links} />
        ) : (
          <MovieDownloadLinks links={details.links} />
        )}
      </div>
    </main>
  );
}

/** Paints while the title's metadata + link chunk are still loading. */
export function TitleDetailsSkeleton() {
  return (
    <main className="w-full animate-pulse" title="loading...">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-3 py-6 md:px-4 md:py-8">
        <div className="flex flex-col gap-5 rounded-xl border bg-surface-raised p-4 shadow-sm md:flex-row md:gap-6 md:p-6">
          <div className="mx-auto h-[420px] w-[280px] shrink-0 rounded-lg bg-muted md:mx-0" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-6 w-32 rounded-full bg-muted" />
            <div className="h-12 w-full rounded-lg bg-muted" />
            <div className="h-6 w-1/2 rounded-full bg-muted" />
            <div className="h-24 w-full rounded bg-muted" />
          </div>
        </div>

        <div className="h-11 w-full rounded-lg bg-muted" />
        <div className="mx-auto h-40 w-full max-w-2xl rounded-xl bg-muted" />
      </div>
    </main>
  );
}
