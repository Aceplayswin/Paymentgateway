import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import { useFilterPanelAnimation } from "../hooks/useFilterPanelAnimation";
import { countActiveFilters } from "../utils/filterUtils";

function FilterPanel({
  open,
  onClose,
  onVisibilityChange,
  docked = false,
  sections = [],
  draftFilters,
  onDraftChange,
  onApply,
  onClearAll,
}) {
  const [panelSearch, setPanelSearch] = useState("");
  const { mounted, visible, handleTransitionEnd } = useFilterPanelAnimation(open);
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(sections.map((section, index) => [section.id, index < 2])),
  );

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [onVisibilityChange, visible]);

  useEffect(() => {
    setOpenSections((previous) => {
      const next = { ...previous };
      sections.forEach((section, index) => {
        if (next[section.id] == null) {
          next[section.id] = index < 2;
        }
      });
      return next;
    });
  }, [sections]);

  const activeCount = useMemo(
    () => countActiveFilters(draftFilters, sections),
    [draftFilters, sections],
  );

  const visibleSections = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();
    if (!query) {
      return sections;
    }
    return sections.filter((section) => section.label.toLowerCase().includes(query));
  }, [panelSearch, sections]);

  const toggleSection = (sectionId) => {
    setOpenSections((previous) => ({ ...previous, [sectionId]: !previous[sectionId] }));
  };

  const updateDraft = (sectionId, value) => {
    onDraftChange({ ...draftFilters, [sectionId]: value });
  };

  if (!mounted) {
    return null;
  }

  return (
    <aside
      className={`filter-panel${visible ? " is-open" : ""}${docked ? " filter-panel--docked" : ""}`}
      aria-label="Filters panel"
      onTransitionEnd={(event) => handleTransitionEnd(event, docked ? "width" : "transform")}
    >
      <div className="filter-panel__body">
      <header className="filter-panel__header">
        <h2>Filters</h2>
        <button type="button" className="filter-panel__close" onClick={onClose} aria-label="Close filters">
          <FiX />
        </button>
      </header>

      <div className="filter-panel__search">
        <input
          type="search"
          name="filter-search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Search filters"
          value={panelSearch}
          onChange={(event) => setPanelSearch(event.target.value)}
        />
        <FiSearch aria-hidden="true" />
      </div>

      <div className="filter-panel__sections">
        {visibleSections.map((section) => {
          const isOpen = openSections[section.id];
          const sectionActive = countActiveFilters(
            { [section.id]: draftFilters[section.id] },
            [section],
          );

          return (
            <section key={section.id} className="filter-panel__section">
              <button
                type="button"
                className="filter-panel__section-toggle"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <span>
                  {section.label}
                  {sectionActive ? ` (${sectionActive})` : ""}
                </span>
                <FiChevronDown className={isOpen ? "rotated" : ""} />
              </button>

              {isOpen ? (
                <div className="filter-panel__section-body">
                  {section.type === "select-text" ? (
                    <div className="filter-panel__dual-input">
                      <select
                        value={draftFilters[section.id]?.operator || "contains"}
                        onChange={(event) =>
                          updateDraft(section.id, {
                            ...draftFilters[section.id],
                            operator: event.target.value,
                          })
                        }
                      >
                        {(section.operators || []).map((operator) => (
                          <option key={operator.value} value={operator.value}>
                            {operator.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={section.placeholder || "Type"}
                        value={draftFilters[section.id]?.value || ""}
                        onChange={(event) =>
                          updateDraft(section.id, {
                            ...draftFilters[section.id],
                            value: event.target.value,
                          })
                        }
                      />
                    </div>
                  ) : null}

                  {section.type === "select" ? (
                    <select
                      value={draftFilters[section.id] || "all"}
                      onChange={(event) => updateDraft(section.id, event.target.value)}
                    >
                      {(section.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {section.type === "range" ? (
                    <div className="filter-panel__range">
                      <div className="filter-panel__range-values">
                        <span>{draftFilters[section.id]?.[0] ?? section.min ?? 0}</span>
                        <span>{draftFilters[section.id]?.[1] ?? section.max ?? 100}</span>
                      </div>
                      <div className="filter-panel__range-inputs">
                        <input
                          type="range"
                          min={section.min ?? 0}
                          max={section.max ?? 100}
                          value={draftFilters[section.id]?.[0] ?? section.min ?? 0}
                          onChange={(event) => {
                            const nextMin = Number(event.target.value);
                            const currentMax = draftFilters[section.id]?.[1] ?? section.max ?? 100;
                            updateDraft(section.id, [Math.min(nextMin, currentMax), currentMax]);
                          }}
                        />
                        <input
                          type="range"
                          min={section.min ?? 0}
                          max={section.max ?? 100}
                          value={draftFilters[section.id]?.[1] ?? section.max ?? 100}
                          onChange={(event) => {
                            const nextMax = Number(event.target.value);
                            const currentMin = draftFilters[section.id]?.[0] ?? section.min ?? 0;
                            updateDraft(section.id, [currentMin, Math.max(nextMax, currentMin)]);
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {section.type === "text" ? (
                    <input
                      type="text"
                      placeholder={section.placeholder || "Type"}
                      value={draftFilters[section.id] || ""}
                      onChange={(event) => updateDraft(section.id, event.target.value)}
                    />
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <footer className="filter-panel__footer">
        <button type="button" className="filter-panel__clear" onClick={onClearAll}>
          Clear all
        </button>
        <div className="filter-panel__footer-actions">
          <button type="button" className="filter-panel__cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="filter-panel__apply" onClick={onApply}>
            Apply{activeCount ? ` (${activeCount})` : ""}
          </button>
        </div>
      </footer>
      </div>
    </aside>
  );
}

export default FilterPanel;
