import { Download } from "lucide-react";
import {
  DownloadSectionHeading,
  NoLinksMessage,
} from "@/components/title-detail/DownloadSectionHeading";
import { groupMovieLinks } from "@/lib/title-links";
import type { MovieLink } from "@/lib/types";
import { cn } from "@/lib/utils";

import { GROUPS } from "@/components/title-detail/TitleDetailsPage";

/**
 * Movie download zone: one card per audio/subtitle variant, each a list of
 * full-width pill links — round download button + quality on the start side,
 * file size + chevron on the end side.
 */
export function MovieDownloadLinks({ links }: { links: MovieLink[] }) {
  const groups = groupMovieLinks(links);

  return (
    <section dir="rtl" className="w-full">
      <DownloadSectionHeading />

      {groups.length === 0 ? (
        <NoLinksMessage />
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {groups.map(({ type, links: groupLinks }) => {
            const { title, Icon, iconClass, circleClass } = GROUPS[type];

            return (
              <div key={type} className="rounded-xl bg-primary/5 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Icon className={cn("size-5 shrink-0", iconClass)} />
                  {title}
                </h3>

                <div className="flex flex-col gap-2" role="list">
                  {groupLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="listitem"
                      className="group flex items-center justify-between gap-3 rounded-full bg-surface-raised px-3 py-2 shadow-xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                    >
                      <span className="flex min-w-0 items-center gap-3">
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

                      <span
                        className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold transition-colors group-hover:bg-primary-foreground/20"
                        dir="ltr"
                      >
                        {link.size}
                      </span>
                    </a>
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
