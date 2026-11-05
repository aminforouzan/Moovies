import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn, faDigits } from "@/lib/utils";
import { buttonVariants, type Button } from "@/components/ui/button";
import {
  useDataTable,
  useDataTableDispatch,
} from "../contexts/DataTableContext";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PageinationButtonProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"button">;

function PageinationButton({
  className,
  isActive,
  size = "icon",
  ...props
}: PageinationButtonProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-button"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "ghost",
          size,
        }),
        "hover:bg-primary hover:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PageinationButton>) {
  return (
    <PageinationButton
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 ps-1.5!", className)}
      {...props}
    >
      <ChevronRightIcon />
      <span className="hidden sm:block">قبلی</span>
    </PageinationButton>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PageinationButton>) {
  return (
    <PageinationButton
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 pe-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">بعدی</span>
      <ChevronLeftIcon />
    </PageinationButton>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

interface PageinationCustomProps {
  totalPages: number;
}

export function PageinationCustom({ totalPages }: PageinationCustomProps) {
  const dataTableState = useDataTable();
  const dataTableDispatch = useDataTableDispatch();
  const activePage = dataTableState.pageination.page;

  const getPaginationItems = () => {
    const items: (number | string)[] = [];

    // Page 1 is always displayed
    items.push(1);

    // Ellipsis before the current page
    if (activePage > 2) {
      items.push("...");
    }

    // current page
    if (activePage !== 1 && activePage !== totalPages) {
      items.push(activePage);
    }

    // Ellipsis after the current page
    if (activePage < totalPages - 1) {
      items.push("...");
    }

    // The last page is always displayed
    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  };

  const paginationItems = getPaginationItems();

  return (
    <Pagination>
      <PaginationContent>
        {activePage > 1 && (
          <PaginationItem>
            <PaginationPrevious
              onClick={() => dataTableDispatch({ type: "PREVIOUS_PAGE" })}
            />
          </PaginationItem>
        )}

        {paginationItems.map((page, index) => {
          if (typeof page === "string") {
            return (
              <PaginationItem key={`${page}-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PageinationButton
                isActive={page === activePage}
                onClick={() =>
                  dataTableDispatch({ type: "SET_PAGE", payload: page })
                }
              >
                {faDigits(String(page))}
              </PageinationButton>
            </PaginationItem>
          );
        })}

        {activePage < totalPages && (
          <PaginationItem>
            <PaginationNext
              onClick={() => dataTableDispatch({ type: "NEXT_PAGE" })}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
