function SimpleCardsSection({
  title,
  subtitle,
  cards = [],
  loading = false,
  variant = "page",
  showHeader = true,
  actions = null,
}) {
  const Wrapper = variant === "page" ? "section" : "div";
  const TitleTag = variant === "page" ? "h1" : "h2";
  const wrapperClass = variant === "subsection" ? "page-subsection" : "";

  return (
    <Wrapper className={wrapperClass || undefined}>
      {showHeader ? (
        <header className={`content-header${actions ? " content-header--with-actions" : ""}`}>
          <div>
            <TitleTag>{title}</TitleTag>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="simple-cards-grid">
        {loading ? (
          <p className="table-empty simple-cards-loading">Loading...</p>
        ) : cards.length ? (
          cards.map((card) => (
            <article key={card.title} className="simple-card">
              <h3>{card.title}</h3>
              <p>{card.value}</p>
            </article>
          ))
        ) : (
          <p className="table-empty simple-cards-loading">No data available.</p>
        )}
      </div>
    </Wrapper>
  );
}

export default SimpleCardsSection;
