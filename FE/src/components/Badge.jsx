function Badge({ status = "Info" }) {
  const normalized = status.toLowerCase();
  let className = "badge";

  if (["success", "active", "processed", "verified", "settled", "enabled", "credit"].includes(normalized)) {
    className += " badge-success";
  } else if (["failed", "critical", "high", "debit"].includes(normalized)) {
    className += " badge-danger";
  } else if (["pending", "processing", "under review", "investigating", "medium"].includes(normalized)) {
    className += " badge-warning";
  } else if (["refunded", "disabled", "low"].includes(normalized)) {
    className += " badge-muted";
  } else {
    className += " badge-info";
  }

  return <span className={className}>{status}</span>;
}

export default Badge;
