/* eslint-disable react-refresh/only-export-components */
import { Suspense } from "react";
import { Await, useLoaderData, type LoaderFunctionArgs } from "react-router";
import NotFound from "@/components/NotFound";
import {
  TitleDetailsPage,
  TitleDetailsSkeleton,
} from "@/components/title-detail/TitleDetailsPage";
import { loadSiteData } from "@/lib/load-site-data";
import { loadTitleDetails } from "@/lib/title-details";
import type { TitleDetails, TitleRecord } from "@/lib/types";

type TitlePageData =
  | { found: true; record: TitleRecord; details: TitleDetails }
  | { found: false };

/**
 * `data.json` holds the title's metadata, the chunk its imdb code points at
 * holds the links/plot/credits. Neither is awaited: the route paints its
 * skeleton right away and streams the page in.
 */
export function clientLoader({ params }: LoaderFunctionArgs) {
  const imdbCode = params.imdbCode ?? "";

  const pageData: Promise<TitlePageData> = loadSiteData().then(async (site) => {
    const record = site.titles.find((title) => title.imdb_code === imdbCode);
    if (!record) return { found: false } as const;

    const details = await loadTitleDetails(imdbCode, record.title_type);
    if (!details) return { found: false } as const;

    return { found: true, record, details } as const;
  });

  return { pageData };
}

// Runs the loader during hydration instead of after it.
clientLoader.hydrate = true;

export default function TitleRoute() {
  // Un-generic `useLoaderData` for the same reason the archive route does it:
  // `SerializeFrom<typeof clientLoader>` mangles the Promise field.
  const { pageData } = useLoaderData() as { pageData: Promise<TitlePageData> };

  return (
    <Suspense fallback={<TitleDetailsSkeleton />}>
      <Await
        resolve={pageData}
        errorElement={
          <main className="w-full py-16 text-center">
            <p className="text-sm text-muted-foreground">
              بارگذاری اطلاعات این عنوان ناموفق بود؛ صفحه را دوباره بارگذاری
              کنید.
            </p>
          </main>
        }
      >
        {(data: TitlePageData) => (
          <>
            <title>{data.found ? data.record.title + " | موویز" : "صفحه پیدا نشد"}</title>
            {data.found ? (
              <TitleDetailsPage record={data.record} details={data.details} />
            ) : (
              <NotFound />
            )}
          </>
        )}
      </Await>
    </Suspense>
  );
}
