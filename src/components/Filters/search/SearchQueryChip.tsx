import { useDataTable } from "@/components/contexts/DataTableContext";
import { HorizontalDivider } from "@/components/HorizontalDivider"

/**
 * Shows the currently applied search query at the top of the filters panel,
 * above every other filter.
 */
export function SearchQueryChip() {
  const applied = useDataTable().filters.search_query.trim();
  if (applied.length === 0) return null;

  return (
    <>
      <div className="mb-3 flex items-center gap-2 text-sm flex-wrap">
        <span>جست‌و‌جوی شما:</span>
        <span className="rounded-sm bg-orange-100 px-1.5 py-0.5 text-orange-600">
          {applied}
        </span>
      </div>
      <HorizontalDivider color="bg-border" />
    </>
  );
}
