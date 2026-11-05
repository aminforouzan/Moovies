/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type Dispatch,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { createDefaultFilters, parseState } from "@/lib/data-table-url";
import { useSearchParams } from "react-router";
import type { DraftFiltersAction, FiltersObj, SiteMeta } from "@/lib/types";
import { useTableMeta } from "./DataTableContext";

// create context
const DraftFiltersContext = createContext<null | FiltersObj>(null);
const DraftFiltersDispatchContext =
  createContext<null | Dispatch<DraftFiltersAction>>(null);

// use context
export function useDraftFilters() {
  const context = useContext(DraftFiltersContext);
  if (context === null) {
    throw new Error(
      "useDraftFilters must be used within a DraftFiltersProvider",
    );
  }
  return context;
}

export function useDraftFiltersDispatch() {
  const context = useContext(DraftFiltersDispatchContext);
  if (context === null) {
    throw new Error(
      "useDraftFiltersDispatch must be used within a DraftFiltersProvider",
    );
  }
  return context;
}

// provide context
export function DraftFiltersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const meta = useTableMeta();
  const [searchParams] = useSearchParams();

  const reducer = useCallback(
    (state: FiltersObj, action: DraftFiltersAction) =>
      draftFiltersReducer(state, action, meta),
    [meta],
  );

  const [draftFilters, dispatch] = useReducer(
    reducer,
    searchParams,
    (sp) => parseState(sp, meta).filters,
  );

  return (
    <DraftFiltersContext value={draftFilters}>
      <DraftFiltersDispatchContext value={dispatch}>
        {children}
      </DraftFiltersDispatchContext>
    </DraftFiltersContext>
  );
}

// reducer logic
function draftFiltersReducer(
  state: FiltersObj,
  action: DraftFiltersAction,
  meta: SiteMeta,
) {
  // do all the changes on the deep copy only
  const stateCopy = structuredClone(state);

  switch (action.type) {
    case "RESET_DRAFT_FILTERS": {
      return createDefaultFilters(meta);
    }
    case "RESET_DRAFT_SEARCH_QUERY": {
      stateCopy.search_query = "";
      return stateCopy;
    }
    case "UPDATE_DRAFT_SEARCH_QUERY": {
      stateCopy.search_query = action.payload;
      return stateCopy;
    }
    case "TOGGLE_CHECKBOX": {
      const key = action.payload.filter_key;
      const value = action.payload.filter_value;
      const wasChecked = action.payload.was_checked;

      if (wasChecked) {
        // HACK because `v` and `value` are unions of string and boolean, the Array.prototype.findIndex() is used instead of `indexOf()` method, because the latter showes TS error
        const valueIdx = stateCopy[key].findIndex((v) => v === value);
        if (valueIdx === -1)
          throw new Error("DraftFiltersContext: did not found checked value");
        stateCopy[key].splice(valueIdx, 1);
      } else {
        if (typeof value === "boolean") {
          (stateCopy[key] as boolean[]).push(value);
        } else {
          (stateCopy[key] as ("series" | "movie")[]).push(value);
        }
      }

      return stateCopy;
    }
    case "TOGGLE_PILL": {
      const value = action.payload.filter_value;
      const wasChecked = action.payload.was_checked;

      if (wasChecked) {
        const valueIdx = stateCopy.genres.findIndex((v) => v === value);
        if (valueIdx === -1)
          throw new Error("DraftFiltersContext: did not found pill checked value");
        stateCopy.genres.splice(valueIdx, 1);
      } else {
        stateCopy.genres.push(value);
      }

      return stateCopy;
    }
    case "UPDATE_RANGE": {
      const key = action.payload.filter_key;
      const dir = action.payload.filter_dir;
      const value = action.payload.value;

      stateCopy[key][dir] = value;

      return stateCopy;
    }
  }
}
