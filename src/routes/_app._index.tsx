/* eslint-disable react-refresh/only-export-components */
import { Suspense } from "react";
import { Await, useLoaderData } from "react-router";
import { Link } from "react-router";
import { TitleHomeCard } from "@/components/TitleHomeCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { SiteMeta, TitleRecord } from "@/lib/types";
import { loadSiteData } from "@/lib/load-site-data";
import { filterAndSortTitles } from "@/lib/filter-and-sort";
import { createDefaultFilters } from "@/lib/data-table-url";
import type { DataTableState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { faNumber } from "@/lib/utils";

type HomeData = {
  meta: SiteMeta;
  section1: TitleRecord[];
  section2: TitleRecord[];
  section3: TitleRecord[];
  section4: TitleRecord[];
  section5: TitleRecord[];
  section6: TitleRecord[];
};

export function clientLoader() {
  const siteData: Promise<HomeData> = loadSiteData().then((site) => {
    const meta = site.meta;
    const titles = site.titles;
    const currentYear = meta.max_year;

    function stateFor(
      filters: Partial<DataTableState["filters"]>,
    ): DataTableState {
      const base = createDefaultFilters(meta);
      return {
        filters: { ...base, ...filters },
        sort: { type: "most-vote", label: "بیش‌ترین‌ رای" },
        pageination: { page: 1, pageSize: 6 },
      };
    }

    const yearFilter = { year_range: { low: currentYear, high: currentYear } };
    const section1State = stateFor({ ...yearFilter, list_type: ["movie"] });
    const section1 = filterAndSortTitles(titles, section1State).slice(0, 14);

    const section2State = stateFor({ ...yearFilter, list_type: ["series"] });
    const section2 = filterAndSortTitles(titles, section2State).slice(0, 14);

    const section3State = {
      ...stateFor({
        year_range: { low: currentYear - 10, high: currentYear },
        imdb_votes_range: { low: 200000, high: meta.max_vote_count },
        genres: ["Action"],
      }),
      sort: { type: "most-score", label: "بیش‌ترین‌ امتیاز" },
    } as DataTableState;
    const section3 = filterAndSortTitles(titles, section3State).slice(0, 14);

    const section4State = {
      ...stateFor({
        year_range: { low: currentYear - 10, high: currentYear },
        imdb_votes_range: { low: 150000, high: meta.max_vote_count },
        genres: ["Romance"],
      }),
      sort: { type: "most-score", label: "بیش‌ترین‌ امتیاز" },
    } as DataTableState;
    const section4 = filterAndSortTitles(titles, section4State).slice(0, 14);

    const section5State = {
      ...stateFor({
        year_range: { low: currentYear - 10, high: currentYear },
        imdb_votes_range: { low: 150000, high: meta.max_vote_count },
        genres: ["Horror"],
      }),
      sort: { type: "most-score", label: "بیش‌ترین‌ امتیاز" },
    } as DataTableState;
    const section5 = filterAndSortTitles(titles, section5State).slice(0, 14);

    const section6State = {
      ...stateFor({
        year_range: { low: currentYear - 10, high: currentYear },
        imdb_votes_range: { low: 150000, high: meta.max_vote_count },
        genres: ["Crime"],
      }),
      sort: { type: "most-score", label: "بیش‌ترین‌ امتیاز" },
    } as DataTableState;
    const section6 = filterAndSortTitles(titles, section6State).slice(0, 14);

    return { meta, section1, section2, section3, section4, section5, section6 };
  });
  return { siteData };
}

clientLoader.hydrate = true;

function Section({
  title,
  items,
  moreTo,
}: {
  title: string;
  items: TitleRecord[];
  moreTo: string;
}) {
  return (
    <section className="flex flex-col gap-3 pb-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <Button asChild variant={"link"}>
          <Link to={moreTo}>
            <span className="relative bottom-0.5">بیشتر</span>
            <ChevronLeft size={16} />
          </Link>
        </Button>
      </header>
      <Carousel
        opts={{
          align: "start",
          direction: "rtl",
          loop: true,
        }}
        className="relative w-full px-9 sm:px-12"
      >
        <CarouselContent className="-ms-3 sm:-ms-4">
          {items.map((t) => (
            <CarouselItem
              key={t.imdb_code}
              className="basis-1/2 ps-3 sm:basis-1/3 sm:ps-4 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-[14.285%]"
            >
              <TitleHomeCard data={t} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-start-1 z-10 size-8 border bg-background/90 shadow-sm backdrop-blur-xs hover:bg-background sm:start-0 sm:size-9" />
        <CarouselNext className="-end-1 z-10 size-8 border bg-background/90 shadow-sm backdrop-blur-xs hover:bg-background sm:end-0 sm:size-9" />
      </Carousel>
    </section>
  );
}

export default function HomeRoute() {
  const { siteData } = useLoaderData() as { siteData: Promise<HomeData> };
  return (
    <>
      <title>خانه | موویز | دانلود فیلم و سریال</title>
      <Suspense
        fallback={
          <main className="mx-auto min-h-[calc(100vh-80px)] w-full max-w-[1664px] min-w-0 px-4 py-4 sm:px-6 sm:py-6" />
        }
      >
        <Await resolve={siteData}>
          {(data: HomeData) => (
            <main className="mx-auto min-h-[calc(100vh-80px)] w-full max-w-[1664px] min-w-0 px-4 py-5 md:px-5 md:py-6">
              <Section
                title={`فیلم‌های ${data.meta.max_year}`}
                items={data.section1}
                moreTo={`/archive?type=movie&year=${data.meta.max_year}-${data.meta.max_year}`}
              />
              <Section
                title={`سریال‌های ${data.meta.max_year}`}
                items={data.section2}
                moreTo={`/archive?type=series&year=${data.meta.max_year}-${data.meta.max_year}`}
              />
              <Section
                title="برترین‌های اکشن دهه اخیر"
                items={data.section3}
                moreTo={`/archive?genres=Action&votes=200000-${data.meta.max_vote_count}&year=${data.meta.max_year - 10}-${data.meta.max_year}&sort=most-score`}
              />
              <Section
                title="برترین‌های عاشقانه دهه اخیر"
                items={data.section4}
                moreTo={`/archive?genres=Romance&votes=150000-${data.meta.max_vote_count}&year=${data.meta.max_year - 10}-${data.meta.max_year}&sort=most-score`}
              />
              <Section
                title="برترین‌های ترسناک دهه اخیر"
                items={data.section5}
                moreTo={`/archive?genres=Horror&votes=150000-${data.meta.max_vote_count}&year=${data.meta.max_year - 10}-${data.meta.max_year}&sort=most-score`}
              />
              <Section
                title="برترین‌های جنایی دهه اخیر"
                items={data.section6}
                moreTo={`/archive?genres=Crime&votes=150000-${data.meta.max_vote_count}&year=${data.meta.max_year - 10}-${data.meta.max_year}&sort=most-score`}
              />

              <section className="mt-4 mb-8 flex flex-row items-center justify-between gap-4 rounded-2xl border bg-muted p-3 sm:p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold">همه فیلم‌ها و سریال‌ها</h2>
                  <p className="text-sm text-muted-foreground">
                    دسته بندی‌، فیلتر و دسترسی به آرشیو کامل
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{`${faNumber(data.meta.movies_num)} فیلم`}</Badge>
                    <Badge variant="secondary">{`${faNumber(data.meta.series_num)} سریال`}</Badge>
                  </div>
                </div>
                <Button asChild className="rounded-full">
                  <Link to="/archive">
                    <span className="relative bottom-0.5">ورود به آرشیو</span>
                    <ChevronLeft size={16} />
                  </Link>
                </Button>
              </section>
            </main>
          )}
        </Await>
      </Suspense>
    </>
  );
}
