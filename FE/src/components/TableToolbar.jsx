import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter } from "react-icons/fi";
import FilterLayout from "./FilterLayout";
import FilterPanel from "./FilterPanel";
import SearchBar from "./SearchBar";
import {
  applyPanelFilters,
  countActiveFilters,
  createEmptyFilters,
} from "../utils/filterUtils";

function TableToolbar({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records",
  filterSections = [],
  rows = [],
  searchableKeys = [],
  onFilteredRowsChange,
  actions = null,
  contentClassName = "table-card",
  children = null,
}) {
  const emptyFilters = useMemo(() => createEmptyFilters(filterSections), [filterSections]);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const onFilteredRowsChangeRef = useRef(onFilteredRowsChange);

  useEffect(() => {
    onFilteredRowsChangeRef.current = onFilteredRowsChange;
  }, [onFilteredRowsChange]);

  useEffect(() => {
    setAppliedFilters(emptyFilters);
    setDraftFilters(emptyFilters);
  }, [emptyFilters]);

  const searchableKeysKey = searchableKeys.join("|");
  const stableSearchableKeys = useMemo(
    () => searchableKeys,
    [searchableKeysKey],
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(appliedFilters, filterSections),
    [appliedFilters, filterSections],
  );

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    const panelFiltered = applyPanelFilters(rows, appliedFilters, filterSections, stableSearchableKeys);

    if (!normalized) {
      return panelFiltered;
    }

    return panelFiltered.filter((row) =>
      stableSearchableKeys.some((key) => String(row[key] || "").toLowerCase().includes(normalized)),
    );
  }, [appliedFilters, filterSections, rows, searchValue, stableSearchableKeys]);

  useEffect(() => {
    onFilteredRowsChangeRef.current?.(filteredRows);
  }, [filteredRows]);

  const openFilterPanel = () => {
    setDraftFilters(appliedFilters);
    setFilterPanelOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <FilterLayout
      panelVisible={panelVisible}
      panel={
        filterSections.length ? (
          <FilterPanel
            docked
            open={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            onVisibilityChange={setPanelVisible}
            sections={filterSections}
            draftFilters={draftFilters}
            onDraftChange={setDraftFilters}
            onApply={handleApplyFilters}
            onClearAll={handleClearFilters}
          />
        ) : null
      }
    >
      <div className={contentClassName || undefined}>
        <div className="table-toolbar">
          <h3>{title}</h3>
          <div className="table-controls">
            <SearchBar value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
            {filterSections.length ? (
              <button type="button" className="filter-btn" onClick={openFilterPanel}>
                <FiFilter />
                Filter
                {activeFilterCount ? <span className="filter-btn__count">{activeFilterCount}</span> : null}
              </button>
            ) : null}
            {actions}
          </div>
        </div>
        {children}
      </div>
    </FilterLayout>
  );
}

export default TableToolbar;
