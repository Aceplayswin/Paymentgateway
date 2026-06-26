function FilterLayout({ panelVisible, children, panel }) {
  return (
    <div className={`filter-layout${panelVisible ? " is-open" : ""}`}>
      <div className="filter-layout__content">{children}</div>
      {panel}
    </div>
  );
}

export default FilterLayout;
