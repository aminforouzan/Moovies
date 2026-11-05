/* eslint-disable react-refresh/only-export-components */
import { Suspense } from "react";
import { Await, useLoaderData, useSearchParams } from "react-router";
import { DataTable, DataTableSkeleton } from "@/components/DataTable";
import {
  DataTableProvider,
  useDataTable,
} from "@/components/contexts/DataTableContext";
import { DraftFiltersProvider } from "@/components/contexts/DraftFiltersContext";
import { filterAndSortTitles } from "@/lib/filter-and-sort";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { loadSiteData } from "@/lib/load-site-data";
import type { SiteDataFile, TitleRecord } from "@/lib/types";

type ArchiveLoaderData = { siteData: Promise<SiteDataFile> };

export function clientLoader() {
  return { siteData: loadSiteData() };
}

clientLoader.hydrate = true;

export default function ArchiveRoute() {
  const { siteData } = useLoaderData() as ArchiveLoaderData;
  const isDesktop = useMediaQuery("(min-width: 64em)");
  const [searchParams] = useSearchParams();

  return (
    <>
      <title>آرشیو | موویز | دانلود فیلم و سریال</title>
      <Suspense
        fallback={
          <main className="mx-auto max-w-416">
            <DataTableSkeleton isDesktop={isDesktop} />
          </main>
        }
      >
        <Await
          resolve={siteData}
          errorElement={
            <p dir="rtl" className="py-16 text-center">
              بارگذاری داده‌ها ناموفق بود؛ صفحه را دوباره بارگذاری کنید.
            </p>
          }
        >
          {(data: SiteDataFile) => (
            <DataTableProvider meta={data.meta}>
                          <DraftFiltersProvider key={searchParams.toString()}>
                            <ArchiveContent titles={data.titles} />
                          </DraftFiltersProvider>
                        </DataTableProvider>
          )}
        </Await>
      </Suspense>
    </>
  );
}

function ArchiveContent({ titles }: { titles: TitleRecord[] }) {
  const dataTableState = useDataTable();
  const displayTitles = filterAndSortTitles(titles, dataTableState);

  return (
    <main className="mx-auto max-w-416">
      <DataTable data={displayTitles} />
    </main>
  );
}
