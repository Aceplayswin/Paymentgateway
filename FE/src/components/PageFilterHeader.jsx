import { useMemo, useState } from "react";
import { FiFilter } from "react-icons/fi";
import FilterLayout from "./FilterLayout";
import FilterPanel from "./FilterPanel";
import { countActiveFilters, createEmptyFilters } from "../utils/filterUtils";

function PageFilterHeader({ title, subtitle, filterSections = [], onApplyFilters, children = null }) {
  const emptyFilters = useMemo(() => createEmptyFilters(filterSections), [filterSections]);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  const activeFilterCount = useMemo(
    () => countActiveFilters(appliedFilters, filterSections),
    [appliedFilters, filterSections],
  );

  const openFilterPanel = () => {
    setDraftFilters(appliedFilters);
    setFilterPanelOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    onApplyFilters?.(draftFilters);
    setFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    onApplyFilters?.(emptyFilters);
  };

  if (!filterSections.length) {
    return (
      <header className="content-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>
    );
  }

  return (
    <FilterLayout
      panelVisible={panelVisible}
      panel={
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
      }
    >
      <header className="content-header content-header--with-actions">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="filter-btn filter-btn--header" onClick={openFilterPanel}>
          <FiFilter />
          Filter
          {activeFilterCount ? <span className="filter-btn__count">{activeFilterCount}</span> : null}
        </button>
      </header>
      {children}
    </FilterLayout>
  );
}

export default PageFilterHeader;
