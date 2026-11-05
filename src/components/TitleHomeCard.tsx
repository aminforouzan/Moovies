import { Link } from "react-router";
import { ImageOff } from "lucide-react";
import type { TitleRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getPosterUrl } from "@/config/site";

export function TitleHomeCard({
  data,
  className,
}: {
  data: TitleRecord;
  className?: string;
}) {
  const posterPath = getPosterUrl(data.imdb_code);
  const MAX_POSTER_RETRIES = 3;
  const [tries, setTries] = useState(0);
  const [loaded, setLoaded] = useState(false);

  return (
    <Link
      to={`/titles/${data.imdb_code}`}
      className={cn("group block w-full", className)}
    >
      <div className="relative aspect-9/12 w-full overflow-hidden rounded-xl border bg-muted">
        {tries < MAX_POSTER_RETRIES ? (
          <img
            key={`${data.imdb_code}-${tries}`}
            src={`${posterPath}?t=${tries}`}
            alt={`${data.title} poster`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              setTries(tries + 1);
              if (tries === MAX_POSTER_RETRIES - 1) setLoaded(true);
            }}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent">
            <ImageOff className="size-8 text-muted-foreground" />
          </div>
        )}
        {!loaded && tries < MAX_POSTER_RETRIES && (
          <div className="absolute inset-0 animate-pulse bg-accent" />
        )}
      </div>
      <p
        className="line-clamp-3 p-2 text-sm font-medium group-hover:underline"
        dir="ltr"
      >
        {data.title}
      </p>
    </Link>
  );
}
