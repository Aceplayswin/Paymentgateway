function ChartCard({ title, subtitle, children }) {
  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      <div className="chart-box">{children}</div>
    </section>
  );
}

export default ChartCard;
