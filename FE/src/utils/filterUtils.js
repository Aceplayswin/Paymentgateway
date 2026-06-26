function toTitleCase(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildFilterSections({ filterKey, filterOptions = [], extraSections = [] }) {
  const sections = [];

  if (filterOptions.length) {
    sections.push({
      id: filterKey,
      label: toTitleCase(filterKey),
      type: "select",
      field: filterKey,
      options: [{ value: "all", label: "All" }, ...filterOptions],
    });
  }

  sections.push({
    id: "searchField",
    label: "Search Field",
    type: "select-text",
    field: "__search__",
    operators: [
      { value: "contains", label: "Contains" },
      { value: "equals", label: "Equals" },
    ],
    placeholder: "Type value...",
  });

  return [...sections, ...extraSections];
}

export function createEmptyFilters(sections = []) {
  const filters = {};

  sections.forEach((section) => {
    if (section.type === "select-text") {
      filters[section.id] = {
        operator: section.defaultOperator || "contains",
        value: "",
      };
      return;
    }

    if (section.type === "select") {
      filters[section.id] = section.defaultValue || "all";
      return;
    }

    if (section.type === "range") {
      filters[section.id] = section.defaultValue || [section.min ?? 0, section.max ?? 100];
      return;
    }

    filters[section.id] = "";
  });

  return filters;
}

export function countActiveFilters(filters, sections = []) {
  return sections.reduce((count, section) => {
    const value = filters[section.id];
    if (value == null) {
      return count;
    }

    if (section.type === "select-text") {
      return value.value?.trim() ? count + 1 : count;
    }

    if (section.type === "select") {
      return value !== "all" && value !== "" ? count + 1 : count;
    }

    if (section.type === "range") {
      const [min, max] = value;
      const defaultRange = section.defaultValue || [section.min ?? 0, section.max ?? 100];
      return min !== defaultRange[0] || max !== defaultRange[1] ? count + 1 : count;
    }

    return String(value).trim() ? count + 1 : count;
  }, 0);
}

function parseInrAmount(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function matchSelectText(rowValue, filterValue, operator) {
  const normalizedRow = String(rowValue || "").toLowerCase();
  const normalizedFilter = filterValue.trim().toLowerCase();
  if (!normalizedFilter) {
    return true;
  }
  return operator === "equals"
    ? normalizedRow === normalizedFilter
    : normalizedRow.includes(normalizedFilter);
}

export function applyPanelFilters(rows, filters, sections = [], searchableKeys = []) {
  return rows.filter((row) =>
    sections.every((section) => {
      const value = filters[section.id];
      if (value == null) {
        return true;
      }

      if (section.type === "select") {
        if (value === "all" || value === "") {
          return true;
        }
        return String(row[section.field] || "").toLowerCase() === String(value).toLowerCase();
      }

      if (section.type === "select-text") {
        if (!value.value?.trim()) {
          return true;
        }

        if (section.field === "__search__") {
          const targets = searchableKeys.length ? searchableKeys : Object.keys(row);
          return targets.some((key) => matchSelectText(row[key], value.value, value.operator));
        }

        return matchSelectText(row[section.field], value.value, value.operator);
      }

      if (section.type === "range") {
        const [min, max] = value;
        const defaultRange = section.defaultValue || [section.min ?? 0, section.max ?? 100];
        if (min === defaultRange[0] && max === defaultRange[1]) {
          return true;
        }

        const numericValue =
          section.format === "inr" ? parseInrAmount(row[section.field]) : Number(row[section.field] || 0);
        return numericValue >= min && numericValue <= max;
      }

      if (!String(value).trim()) {
        return true;
      }

      return matchSelectText(row[section.field], value, "contains");
    }),
  );
}
