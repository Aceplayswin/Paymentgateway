export function getChartTheme(isLight) {
  if (isLight) {
    return {
      grid: "#e2e8f0",
      axis: "#64748b",
      tooltipStyle: {
        backgroundColor: "#ffffff",
        border: "1px solid rgba(15, 23, 42, 0.12)",
        borderRadius: "10px",
        color: "#0f172a",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
      },
    };
  }

  return {
    grid: "#1f2937",
    axis: "#94a3b8",
    tooltipStyle: {
      backgroundColor: "#0f172a",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      borderRadius: "10px",
      color: "#dbeafe",
      boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
    },
  };
}
