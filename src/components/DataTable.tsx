import type { TitleRecord } from "@/lib/types";
import { useDataTable, useDataTableDispatch } from "./contexts/DataTableContext";
import { PageinationCustom } from "@/components/ui/pagination";
import { CardSkeleton, TitleCard } from "./TitleCard";
import { SortDesktop } from "./sort/SortDesktop";
import { faNumber } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { FiltersDesktop } from "./Filters/FiltersDesktop";
import { FiltersMobile } from "./Filters/FiltersMobile";
import { SortMobile } from "./sort/SortMobile";
import { HeaderSlot } from "./HeaderSlot";
import { Button } from "@/components/ui/button";

export function DataTable({ data }: { data: TitleRecord[] }) {
  const dataTableState = useDataTable();
  const isDesktop = useMediaQuery("(min-width: 64em)");

  const { page, pageSize } = dataTableState.pageination;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageItems = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto gap-x-2 p-4 lg:flex">
      <MobileHeaderBar isDesktop={isDesktop} count={data.length} />
      {isDesktop && (
        <div className="max-w-2xs min-w-2xs">
          <FiltersDesktop />
        </div>
      )}
      <div className="flex w-full flex-col gap-y-3">
        {isDesktop && (
          <div className="flex items-center justify-between border-b">
            <div className="flex items-center gap-x-1">
              <SortDesktop />
            </div>
            <p className="text-xs text-muted-foreground">{`${faNumber(data.length)} آیتم`}</p>
          </div>
        )}
        {pageItems.length > 0 ? (
          <>
            <div className="mx-auto grid w-fit grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {pageItems.map((itemData) => (
                <TitleCard data={itemData} key={itemData.imdb_code} />
              ))}
            </div>
            <div className="py-5">
              <PageinationCustom totalPages={totalPages} />
            </div>
          </>
        ) : (
          <EmptyResult
            hasResults={data.length > 0}
            page={page}
            totalPages={totalPages}
          />
        )}
      </div>
    </div>
  );
}

// Skeleton Loading
export function DataTableSkeleton({ isDesktop }: { isDesktop: boolean }) {
  const emptyArr = Array(12).fill(null);

  return (
    <div className="mx-auto gap-x-2 p-3 lg:flex" title="loading...">
      {isDesktop && (
        <div className="flex h-110 min-w-2xs flex-col gap-y-3.5 rounded-md border bg-accent p-4 shadow-sm"></div>
      )}
      <div className="flex w-full flex-col gap-y-5">
        {isDesktop && (
          <div className="h-10 rounded-lg border bg-accent shadow-sm"></div>
        )}
        <div className="mx-auto grid w-fit grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {emptyArr.map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
        <div className="mx-auto h-9 w-40 rounded-lg bg-accent shadow-sm lg:w-48"></div>
      </div>
    </div>
  );
}

function EmptyResult({
  hasResults,
  page,
  totalPages,
}: {
  hasResults: boolean;
  page: number;
  totalPages: number;
}) {
  const dataTableDispatch = useDataTableDispatch();

  return (
    <div
      dir="rtl"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center"
    >
      <p className="text-lg font-semibold">چیزی پیدا نکردم! 🥲</p>
      <p className="text-sm text-muted-foreground">
        {hasResults
          ? `صفحهٔ ${faNumber(page)} خالی است؛ آخرین صفحه ${faNumber(totalPages)} است.`
          : "جست‌وجو، فیلترها یا مرتب‌سازی را تغییر بده — شاید با عبارت دیگری نتیجه بگیری."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {hasResults && (
          <Button
            variant="outline"
            onClick={() => dataTableDispatch({ type: "RESET_PAGE" })}
          >
            رفتن به صفحهٔ اول
          </Button>
        )}
        <Button onClick={() => dataTableDispatch({ type: "RESET_FILTERS" })}>
          پاک کردن فیلترها
        </Button>
      </div>
    </div>
  );
}

function MobileHeaderBar({
  isDesktop,
  count,
}: {
  isDesktop: boolean;
  count: number;
}) {
  if (isDesktop) return null;

  return (
    <HeaderSlot>
      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-x-1">
          <FiltersMobile />
          <SortMobile />
        </div>
        <p className="text-xs text-muted-foreground">{`${faNumber(count)} آیتم`}</p>
      </div>
    </HeaderSlot>
  );
}
