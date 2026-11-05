import { Download } from "lucide-react";
import {
  DownloadSectionHeading,
  NoLinksMessage,
} from "@/components/title-detail/DownloadSectionHeading";
import { groupSeriesLinks } from "@/lib/title-links";
import type { SeriesLink } from "@/lib/types";
import { faNumber, cn } from "@/lib/utils";

import { GROUPS } from "@/components/title-detail/TitleDetailsPage";

/**
 * Series download zone: one card per audio/subtitle variant, each split into
 * season blocks whose links are full-width pills.
 */
export function SeriesDownloadLinks({ links }: { links: SeriesLink[] }) {
  const groups = groupSeriesLinks(links);

  return (
    <section dir="rtl" className="w-full">
      <DownloadSectionHeading />

      {groups.length === 0 ? (
        <NoLinksMessage />
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {groups.map(({ type, seasons }) => {
            const { title, Icon, iconClass, circleClass } = GROUPS[type];

            return (
              <div key={type} className="rounded-xl bg-primary/5 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Icon className={cn("size-5 shrink-0", iconClass)} />
                  {title}
                </h3>

                <div className="flex flex-col gap-4">
                  {seasons.map((season) => (
                    <div key={season.season}>
                      <h4 className="mb-2 border-s-4 border-primary ps-2 text-base font-semibold">
                        فصل {faNumber(Number(season.season))}
                      </h4>

                      <div className="flex flex-col gap-1.5">
                        {season.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between gap-3 rounded-full bg-surface-raised px-4 py-2 shadow-xs transition-all duration-150 hover:bg-primary hover:text-primary-foreground"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-primary-foreground group-hover:text-primary",
                                  circleClass,
                                )}
                              >
                                <Download
                                  className="size-[18px]"
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="text-base font-medium">
                                کیفیت {link.resolution}
                              </span>
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
