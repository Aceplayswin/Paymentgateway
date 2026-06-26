import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";

function StatCard({ title, value, trend, direction, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        <div className="icon-chip">{icon}</div>
      </div>
      <h3>{value}</h3>
      <p className={direction === "up" ? "trend-up" : "trend-down"}>
        {direction === "up" ? <FiTrendingUp /> : <FiTrendingDown />}
        {trend}
      </p>
    </article>
  );
}

export default StatCard;
