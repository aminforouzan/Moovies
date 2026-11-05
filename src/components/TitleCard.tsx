import { Link, useSearchParams } from "react-router";
import { Card } from "@/components/ui/card";
import { Star, ArrowDownToLine, Film, Tv, ImageOff } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { TitleRecord } from "@/lib/types";
import { cn, faDigits, formatVotes } from "@/lib/utils";
import { useState, Fragment } from "react";
import { genreLabel } from "@/lib/genres";
import { HighlightTitle } from "./Filters/search/HighlightTitle";
import { getPosterUrl } from "@/config/site";

export function TitleCard({ data }: { data: TitleRecord }) {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const isMovie = data.title_type === "movie";
  const posterPath = getPosterUrl(data.imdb_code);
  const MAX_POSTER_RETRIES = 3;
  const [tries, setTries] = useState(0);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <CardSkeleton></CardSkeleton>}
      <Card
        className={cn(
          !loaded && "absolute -top-[999px] -left-[999px]",
          "w-[302px] overflow-hidden border p-0",
        )}
      >
        <div className="relative">
          {tries < MAX_POSTER_RETRIES ? (
            <img
              key={`${data.imdb_code}-${tries}`}
              src={`${posterPath}?t=${tries}`}
              alt={`${data.title} poster`}
              width={300}
              height={450}
              onError={() => {
                setTries(tries + 1);
                if (tries === MAX_POSTER_RETRIES - 1) setLoaded(true);
              }}
              onLoad={() => setLoaded(true)}
            />
          ) : (
            <div className="flex h-[450px] w-[300px] items-center justify-center bg-accent">
              <ImageOff />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[13%] bg-linear-to-t from-black/70 via-black/55 to-transparent"></div>
          <div className="absolute bottom-0 z-20 flex w-full justify-between p-3">
            <div className="flex gap-x-1.5">
              {data.dubbed && <Badge variant={"secondary"}>دوبله</Badge>}
              {data.subtitle && <Badge variant="muted">زیرنویس</Badge>}
            </div>
            <span className="flex flex-row-reverse items-center gap-x-1.5 text-sm font-semibold text-white">
              {isMovie && <Film strokeWidth={1} size={22} />}
              {!isMovie && (
                <Tv strokeWidth={1} size={22} className="-translate-y-0.5" />
              )}
              {isMovie ? "فیلم" : "سریال"}
            </span>
          </div>
        </div>
        <div className="flex h-full flex-col justify-between p-3">
          <div>
            <h3 className="text-end text-[1.375rem] font-medium">
              {HighlightTitle(data.title, q)}
            </h3>
          </div>

          <div>
            <div className="my-2 flex items-center gap-1.5 pb-2 text-sm text-muted-foreground flex-wrap">
              <span>
                {data.year &&
                  faDigits(data.year.split("-").reverse().join("-"))}
              </span>
              {data.year && data.genres.length > 0 && (
                <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
              )}
              {data.genres.map((genre, idx) => {
                return (
                  <Fragment key={idx}>
                    <span>{genreLabel(genre)}</span>
                    {idx !== data.genres.length - 1 ? (
                      <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-x-3">
                <Button
                  variant="outline"
                  className="rounded-lg text-base"
                  asChild
                >
                  <Link to={`/titles/${data.imdb_code}`} target="_blank">
                    دانلود
                    <ArrowDownToLine />
                  </Link>
                </Button>
              </div>
              <div className="flex h-fit translate-y-5/12 flex-row-reverse gap-x-1.5">
                <Star size={18} color="#facc15" fill="#facc15" />
                <span className="font-semibold">{data.imdb_rate}</span>
                <span className="translate-y-px text-sm text-muted-foreground">
                  ({formatVotes(data.imdb_votes)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// Skeleton loading component
export function CardSkeleton() {
  return (
    <div
      className="flex h-140 w-75.5 flex-col overflow-hidden rounded-xl border bg-accent shadow-sm"
      title="loading..."
    >
      <div className="h-112.5 w-full bg-input"></div>
      <div className="flex w-full grow flex-col justify-between p-3">
        <div className="h-6.5 w-7/12 self-end rounded-xl bg-input"></div>
        <div className="flex items-center justify-between">
          <div className="h-9 w-24.5 rounded-full bg-input"></div>
          <div className="flex gap-x-1.5">
            <div className="h-6 w-10.5 rounded-xl bg-input"></div>
            <div className="h-6 w-5.5 rounded-xl bg-input"></div>
            <div className="h-6 w-4.5 rounded-xl bg-input"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
