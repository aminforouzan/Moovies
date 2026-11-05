import { useState } from "react";
import { CalendarDays, Clock, Film, ImageOff, Star, Tv } from "lucide-react";
import { genreList } from "@/lib/genres";
import { countSeriesSeasons } from "@/lib/title-links";
import type { TitleDetails, TitleRecord } from "@/lib/types";
import { faDigits, faNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TitleHeroProps {
  record: TitleRecord;
  details: TitleDetails;
}

/**
 * Top zone of a title page: poster + title + rating + plot + credits.
 * Shared verbatim by movies and series — only the type wording changes.
 */
export function TitleHero({ record, details }: TitleHeroProps) {
  const isSeries = record.title_type === "series";
  const seasonCount =
    details.title_type === "series" ? countSeriesSeasons(details.links) : 0;

  return (
    <section
      dir="rtl"
      className="relative flex flex-col gap-5 overflow-hidden rounded-xl border bg-surface-raised p-4 shadow-sm md:flex-row md:items-start md:gap-6 md:p-6"
    >
      <Poster record={record} />

      <div className="z-10 flex min-w-0 flex-1 flex-col text-right">
        <h1 className="text-2xl leading-relaxed font-semibold tracking-tight md:text-3xl">
          {record.title}
        </h1>

        <div className="mt-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
            {isSeries ? (
              <Tv className="size-4 opacity-70" />
            ) : (
              <Film className="size-4 opacity-70" />
            )}
            {isSeries ? "سریال تلویزیونی" : "فیلم سینمایی"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-primary/5 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Star className="size-5 text-[#facc15]" fill="#facc15" />
            <span className="text-xl font-bold text-foreground">
              {faNumber(record.imdb_rate)}
            </span>
            <span className="text-xs text-muted-foreground">
              از {faNumber(record.imdb_votes)} رای
            </span>
          </div>

          <Divider />

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>{record.year ? faDigits(record.year) : "نامشخص"}</span>
          </div>

          {record.runtime !== null && (
            <>
              <Divider />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-4" />
                <span>
                  {isSeries
                    ? `${faNumber(record.runtime)} دقیقه هر قسمت`
                    : `${faNumber(record.runtime)} دقیقه`}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {record.dubbed && (
            <Badge variant="secondary" className="px-3 py-1">
              دوبله فارسی
            </Badge>
          )}
          {record.subtitle && (
            <Badge variant={"muted"} className="px-3 py-1">
              زیرنویس
            </Badge>
          )}
          {record.nosub && (
            <Badge className="px-3 py-1" variant={"outline"}>
              زبان اصلی
            </Badge>
          )}
          {isSeries && seasonCount > 0 && (
            <Badge variant={"primary-soft"} className="px-3 py-1">
              {`${faNumber(seasonCount)} فصل کامل`}
            </Badge>
          )}
        </div>

        {details.plot && (
          <p
            className="mt-5 text-justify text-sm leading-relaxed text-muted-foreground"
            dir="ltr"
          >
            {details.plot}
          </p>
        )}

        <dl className="mt-8 grid grid-cols-1 gap-x-4 gap-y-2 border-t pt-3 text-xs sm:grid-cols-2">
          <Credit label="کارگردان" value={details.director} />
          <Credit label="نویسنده" value={details.writer} />
          <Credit label="ستارگان" value={details.actors} />
          <Credit label="ژانر" value={genreList(record.genres)} />
        </dl>
      </div>
    </section>
  );
}

interface PosterProps {
  record: TitleRecord;
}

function Poster({ record }: PosterProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative mx-auto h-[420px] w-[280px] shrink-0 overflow-hidden rounded-lg bg-muted shadow-md md:mx-0">
      {failed ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-8" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={`/posters/${record.imdb_code}.jpg`}
          alt={`پوستر ${record.title}`}
          width={280}
          height={420}
          className="h-full w-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="size-1 rounded-full bg-border" />;
}

interface CreditProps {
  label: string;
  value: string | null;
}

function Credit({ label, value }: CreditProps) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-1.5">
      <dt className="shrink-0 font-semibold text-foreground">{label}:</dt>
      <dd className="min-w-0 text-muted-foreground" dir="auto">
        {value}
      </dd>
    </div>
  );
}
