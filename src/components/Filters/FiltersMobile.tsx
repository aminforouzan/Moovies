import { useState } from "react";
import type { ExpandableFilters } from "../../lib/types";
import { ButtonOutlined } from "../buttons/ButtonOutlined";
import { HorizontalDivider } from "../HorizontalDivider";
import { XIcon, ArrowRight } from "lucide-react";
import { countChangedKeys, FILTERS_UI } from "../../lib/utils";
import { createDefaultFilters } from "@/lib/data-table-url";
import { SlidersHorizontal } from "lucide-react";
import {
  useDataTable,
  useDataTableDispatch,
  useTableMeta,
} from "../contexts/DataTableContext";
import {
  useDraftFilters,
  useDraftFiltersDispatch,
} from "../contexts/DraftFiltersContext";
import { useEffect } from "react";
import { FilterMobileFooter } from "./footer/FilterMobileFooter";
import { FilterWrapper } from "./wrapper/FilterWrapper";
import { SearchQueryChip } from "@/components/Filters/search/SearchQueryChip";
import { Portal } from "@/Portal";

export function FiltersMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFilter, setExpandedFilter] =
    useState<null | ExpandableFilters>(null);
  const appliedFilters = useDataTable().filters;
  const dataTableDispatch = useDataTableDispatch();
  const draftFilters = useDraftFilters();
  const draftFiltersDispatch = useDraftFiltersDispatch();
  const meta = useTableMeta();

  // disable scrolling body when modal is open
  useEffect(() => {
    document.body.classList.toggle("no-scroll", isOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  const numOfFilters = countChangedKeys(
    createDefaultFilters(meta),
    appliedFilters,
  );

  function handleFooterApplyButton() {
    // Change Data
    dataTableDispatch({ type: "SET_FILTERS", payload: draftFilters });
    // change UI states
    setIsOpen(false);
    setExpandedFilter(null);
  }

  function handleFooterClearButton() {
    // Change Data
    draftFiltersDispatch({ type: "RESET_DRAFT_FILTERS" });
    dataTableDispatch({ type: "RESET_FILTERS" });
    // change UI states
    setIsOpen(false);
    setExpandedFilter(null);
  }

  return (
    <>
      <ButtonOutlined
        handleClick={() => setIsOpen(true)}
        notifNum={numOfFilters > 0 ? numOfFilters : null}
      >
        <SlidersHorizontal size={16} />
        <span>فیلتر</span>
      </ButtonOutlined>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex flex-col justify-between bg-background">
            <div className="overflow-auto px-5 py-4">
              <ModalHeader
                title={
                  expandedFilter === null ? "فیلترها" : expandedFilter.title
                }
                icon={expandedFilter === null ? "close" : "undo"}
                handleIconClick={() => {
                  if (expandedFilter === null) {
                    setIsOpen(false);
                  } else {
                    setExpandedFilter(null);
                  }
                }}
              />
              <ModalMain
                expandedFilter={expandedFilter}
                setExpandedFilter={setExpandedFilter}
              />
            </div>
            <FilterMobileFooter
              handleApplyClick={handleFooterApplyButton}
              handleClearClick={handleFooterClearButton}
            />
          </div>
        </Portal>
      )}
    </>
  );
}

interface ModalHeaderProps {
  title: string;
  icon: "close" | "undo";
  handleIconClick: () => void;
}

function ModalHeader({ title, icon, handleIconClick }: ModalHeaderProps) {
  return (
    <header className="flex items-center gap-x-3.5 pb-4">
      <button type="button" onClick={handleIconClick}>
        {icon === "close" ? <XIcon size={28} /> : <ArrowRight size={28} />}
      </button>
      <h4 className="text-lg font-medium">{title}</h4>
    </header>
  );
}

interface ModalMainProps {
  expandedFilter: ExpandableFilters | null;
  setExpandedFilter: (f: ExpandableFilters) => void;
}

function ModalMain({ expandedFilter, setExpandedFilter }: ModalMainProps) {
  // when a filter was chosen, show it's data
  if (expandedFilter) {
    switch (expandedFilter.filter_type) {
      case "check_box":
        return (
          <FilterWrapper
            type="checkbox"
            filterUIData={expandedFilter}
            platform="mobile-expanded"
          />
        );
      case "range":
        return (
          <FilterWrapper
            type="range"
            filterUIData={expandedFilter}
            platform="mobile-expanded"
          />
        );
      case "pill":
        return (
          <FilterWrapper
            type="pill"
            filterUIData={expandedFilter}
            platform="mobile-expanded"
          />
        );
    }
  }

  // if no filter was chosen, show all filters in main modal:
  return (
    <>
      <SearchQueryChip />
      {FILTERS_UI.map((filter, idx) => {
        switch (filter.filter_type) {
          case "check_box": {
            return (
              <div key={idx}>
                <FilterWrapper
                  type="checkbox"
                  filterUIData={filter}
                  platform="mobile-notExpanded"
                  handleExpandClick={() => setExpandedFilter(filter)}
                />
                {idx < FILTERS_UI.length - 1 ? (
                  <HorizontalDivider color="bg-border" />
                ) : null}
              </div>
            );
          }
          case "range": {
            return (
              <div key={idx}>
                <FilterWrapper
                  type="range"
                  filterUIData={filter}
                  platform="mobile-notExpanded"
                  handleExpandClick={() => setExpandedFilter(filter)}
                />
                {idx < FILTERS_UI.length - 1 ? (
                  <HorizontalDivider color="bg-border" />
                ) : null}
              </div>
            );
          }
          case "pill": {
            return (
              <div key={idx}>
                <FilterWrapper
                  type="pill"
                  filterUIData={filter}
                  platform="mobile-notExpanded"
                  handleExpandClick={() => setExpandedFilter(filter)}
                />
                {idx < FILTERS_UI.length - 1 ? (
                  <HorizontalDivider color="bg-border" />
                ) : null}
              </div>
            );
          }
        }
      })}
    </>
  );
}
