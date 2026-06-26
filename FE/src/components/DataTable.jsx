import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiEye, FiFilter } from "react-icons/fi";
import SearchBar from "./SearchBar";
import FilterLayout from "./FilterLayout";
import FilterPanel from "./FilterPanel";
import Badge from "./Badge";
import Pagination from "./Pagination";
import Modal from "./Modal";
import {
  applyPanelFilters,
  buildFilterSections,
  countActiveFilters,
  createEmptyFilters,
} from "../utils/filterUtils";

function DataTable({
  title,
  rows,
  columns,
  searchableKeys = [],
  filterOptions = [],
  filterKey = "status",
  filterSections: customFilterSections,
  pageSize = 5,
  showExport = true,
}) {
  const filterSections = useMemo(
    () => customFilterSections || buildFilterSections({ filterKey, filterOptions }),
    [customFilterSections, filterKey, filterOptions],
  );

  const emptyFilters = useMemo(() => createEmptyFilters(filterSections), [filterSections]);

  const [query, setQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    setAppliedFilters(emptyFilters);
    setDraftFilters(emptyFilters);
    setCurrentPage(1);
  }, [emptyFilters]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(appliedFilters, filterSections),
    [appliedFilters, filterSections],
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const panelFiltered = applyPanelFilters(rows, appliedFilters, filterSections, searchableKeys);

    return panelFiltered.filter((row) => {
      if (!normalized) {
        return true;
      }
      return searchableKeys.some((key) =>
        String(row[key] || "").toLowerCase().includes(normalized),
      );
    });
  }, [appliedFilters, filterSections, query, rows, searchableKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const handleSearch = (value) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const openFilterPanel = () => {
    setDraftFilters(appliedFilters);
    setFilterPanelOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setFilterPanelOpen(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

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
      <section className="table-card">
        <header className="table-header">
          <div>
            <h3>{title}</h3>
            <p>{filteredRows.length} records found</p>
          </div>
          <div className="table-actions">
            <SearchBar value={query} onChange={handleSearch} placeholder="Search records" />
            <button type="button" className="filter-btn" onClick={openFilterPanel}>
              <FiFilter />
              Filter
              {activeFilterCount ? <span className="filter-btn__count">{activeFilterCount}</span> : null}
            </button>
            {showExport ? (
              <button type="button" className="outline-btn">
                <FiDownload />
                Export
              </button>
            ) : null}
          </div>
        </header>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id || row.disputeId || row.refundId || row.transactionId || row.settlementId || row.complaintId || row.payoutId || row.entryId || row.ip}>
                  {columns.map((column) => {
                    const value = row[column.key];
                    if (column.type === "badge") {
                      return (
                        <td key={column.key}>
                          <Badge status={value} />
                        </td>
                      );
                    }
                    return <td key={column.key}>{value}</td>;
                  })}
                  <td>
                    <button type="button" className="icon-view" onClick={() => setSelectedRow(row)}>
                      <FiEye />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        <Modal open={Boolean(selectedRow)} title="Details" onClose={() => setSelectedRow(null)}>
          <div className="details-grid">
            {selectedRow
              ? Object.entries(selectedRow).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {value}
                  </p>
                ))
              : null}
          </div>
        </Modal>
      </section>
    </FilterLayout>
  );
}

export default DataTable;
