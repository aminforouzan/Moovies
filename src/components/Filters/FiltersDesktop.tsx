import { FILTERS_UI } from "../../lib/utils";
import { HorizontalDivider } from "../HorizontalDivider";
import { SearchQueryChip } from "@/components/Filters/search/SearchQueryChip";
import { useState } from "react";
import { useDataTableDispatch } from "../contexts/DataTableContext";
import {
  useDraftFilters,
  useDraftFiltersDispatch,
} from "../contexts/DraftFiltersContext";
import { FilterDesktopFooter } from "./footer/FilterDesktopFooter";
import { FilterWrapper } from "./wrapper/FilterWrapper";

export function FiltersDesktop() {
  // this state is used to force each filter to remount and reset it's initial states after every time the user clicks on "apply filters" or "clear filters"
  const [forceRemountKey, setForceRemountKey] = useState(0);
  const dataTableDispatch = useDataTableDispatch();
  const draftFilters = useDraftFilters();
  const draftFiltersDispatch = useDraftFiltersDispatch();

  function handleFooterApplyButton() {
    // Change UI states
    setForceRemountKey(forceRemountKey + 1);
    // Change Data
    dataTableDispatch({ type: "SET_FILTERS", payload: draftFilters });
  }

  function handleFooterClearButton() {
    // Change UI states
    setForceRemountKey(forceRemountKey + 1);
    // Change Data
    draftFiltersDispatch({ type: "RESET_DRAFT_FILTERS" });
    dataTableDispatch({ type: "RESET_FILTERS" });
  }

  return (
    <div className="rounded-md border border-border shadow-sm">
      <h4 className="px-4 py-4 text-lg font-medium">فیلترها</h4>
      <div className="px-4">
        <SearchQueryChip />
        {FILTERS_UI.map((filter, idx) => {
          const content: React.ReactNode[] = [];
          switch (filter.filter_type) {
            case "range":
              content.push(
                <FilterWrapper
                  key={String(forceRemountKey) + String(idx)}
                  type="range"
                  filterUIData={filter}
                  platform="desktop"
                />,
              );
              break;
            case "check_box":
              content.push(
                <FilterWrapper
                  key={String(forceRemountKey) + String(idx)}
                  type="checkbox"
                  filterUIData={filter}
                  platform="desktop"
                />,
              );
              break;
            case "pill":
              content.push(
                <FilterWrapper
                  key={String(forceRemountKey) + String(idx)}
                  type="pill"
                  filterUIData={filter}
                  platform="desktop"
                />,
              );
              break;
          }
          if (idx < FILTERS_UI.length - 1)
            content.push(
              <HorizontalDivider
                color="bg-border"
                key={"divider" + idx}
              />,
            );
          return content;
        })}
      </div>
      <FilterDesktopFooter
        handleApplyClick={handleFooterApplyButton}
        handleClearClick={handleFooterClearButton}
      />
    </div>
  );
}
