import { buttonVariants } from "@/components/ui/button";
import { cn, faNumber } from "@/lib/utils";
import type { MovieLink, SeriesLink, SeriesSeason } from "@/lib/types";

/**
 * Everything needed to render a title's download links. The archive no longer
 * uses it — the title detail route will.
 */

// MOVIE LINKS
interface MovieLinksProps {
  data: MovieLink[];
}

export function MovieLinks({ data }: MovieLinksProps) {
  const dubLinks: MovieLink[] = [];
  const subLinks: MovieLink[] = [];
  const nosubLinks: MovieLink[] = [];
  data.forEach((link) => {
    if (link.type === "dub") dubLinks.push(link);
    else if (link.type === "sub") subLinks.push(link);
    else nosubLinks.push(link);
  });

  return (
    <div className="flex flex-col gap-y-2.5">
      {dubLinks.length > 0 && (
        <LinksWraper data={dubLinks} dataType="movie" title="دوبله فارسی" />
      )}
      {subLinks.length > 0 && (
        <LinksWraper
          data={subLinks}
          dataType="movie"
          title="زیرنویس (softsub)"
        />
      )}
      {nosubLinks.length > 0 && (
        <LinksWraper data={nosubLinks} dataType="movie" title="زبان اصلی" />
      )}
    </div>
  );
}

// SERIES LINKS
interface SeriesLinksProps {
  data: SeriesLink[];
}

export function SeriesLinks({ data }: SeriesLinksProps) {
  let dubSeasons: SeriesSeason[] = [];
  let subSeasons: SeriesSeason[] = [];
  let nosubSeasons: SeriesSeason[] = [];
  data.forEach((item) => {
    if (item.type === "dub") dubSeasons = item.seasons;
    else if (item.type === "sub") subSeasons = item.seasons;
    else nosubSeasons = item.seasons;
  });

  return (
    <div className="flex flex-col gap-y-2.5">
      {dubSeasons.length > 0 && (
        <LinksWraper data={dubSeasons} dataType="series" title="دوبله فارسی" />
      )}
      {subSeasons.length > 0 && (
        <LinksWraper
          data={subSeasons}
          dataType="series"
          title="زیرنویس (softsub)"
        />
      )}
      {nosubSeasons.length > 0 && (
        <LinksWraper data={nosubSeasons} dataType="series" title="زبان اصلی" />
      )}
    </div>
  );
}

// Links MODAL sub-components
interface LinksWrapperProps {
  data: MovieLink[] | SeriesSeason[];
  dataType: "movie" | "series";
  title: string;
}

function LinksWraper({ data, dataType, title }: LinksWrapperProps) {
  return (
    <div className="flex flex-col gap-y-2">
      <p className="my-3 text-xl leading-tight font-semibold">{title}</p>
      {dataType === "movie"
        ? (data as MovieLink[]).map((link, idx) => (
            <Link
              text={link.resolution}
              url={link.url}
              size={link.size}
              key={idx}
            />
          ))
        : (data as SeriesSeason[]).map((item, idx) => (
            <SeasonLinks num={item.season} links={item.links} key={idx} />
          ))}
    </div>
  );
}

interface SeasonLinksProps {
  num: string;
  links: SeriesSeason["links"];
}

function SeasonLinks({ num, links }: SeasonLinksProps) {
  return (
    <div className="rounded-lg px-2 py-1.5">
      <p className="w-full py-2 font-semibold">فصل {faNumber(Number(num))}</p>
      <div className="flex flex-col gap-y-1">
        {links.map((link, idx) => (
          <Link text={link.resolution} url={link.url} key={idx} />
        ))}
      </div>
    </div>
  );
}

interface LinkProps {
  text: string;
  url: string;
  size?: string;
}

function Link({ text, url, size }: LinkProps) {
  return (
    <a
      href={url}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "justify-between pt-2.5 hover:border-primary hover:bg-primary hover:text-primary-foreground",
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{text}</span>
      {size && <span dir="ltr">{size}</span>}
    </a>
  );
}
