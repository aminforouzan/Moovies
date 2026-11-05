/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { DataTableAction, DataTableState, SiteMeta } from "@/lib/types";
import {
  dataTableReducer,
  parseState,
  stateToSearchParams,
} from "@/lib/data-table-url";

export type DataTableDispatch = (action: DataTableAction) => void;

// create state and dispatch contexts
const DataTableContext = createContext<DataTableState | null>(null);
const DataTableDispatchContext = createContext<DataTableDispatch | null>(null);
const TableMetaContext = createContext<SiteMeta | null>(null);

// use the context, and return it to be used in other components with custom hooks
export function useDataTable() {
  const context = useContext(DataTableContext);
  if (context === null) {
    throw new Error("useDataTable must be used within a DataTableProvider");
  }
  return context;
}

export function useDataTableDispatch() {
  const context = useContext(DataTableDispatchContext);
  if (context === null) {
    throw new Error(
      "useDataTableDispatch must be used within a DataTableProvider",
    );
  }
  return context;
}

export function useTableMeta() {
  const context = useContext(TableMetaContext);
  if (context === null) {
    throw new Error("useTableMeta must be used within a DataTableProvider");
  }
  return context;
}

/**
 * The URL is the single source of truth: state is parsed from the query
 * string on every render, and every action is applied by navigating.
 */
export function DataTableProvider({
  meta,
  children,
}: {
  meta: SiteMeta;
  children: ReactNode;
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const state = useMemo(
    () => parseState(searchParams, meta),
    [searchParams, meta],
  );

  const dispatch = useCallback<DataTableDispatch>(
    (action) => {
      const current = parseState(
        new URLSearchParams(window.location.search),
        meta,
      );
      const next = dataTableReducer(current, action, meta);
      const query = stateToSearchParams(next, meta).toString();
      navigate({ search: query.length > 0 ? `?${query}` : "" });
    },
    [meta, navigate],
  );

  return (
    <TableMetaContext value={meta}>
      <DataTableContext value={state}>
        <DataTableDispatchContext value={dispatch}>
          {children}
        </DataTableDispatchContext>
      </DataTableContext>
    </TableMetaContext>
  );
}
