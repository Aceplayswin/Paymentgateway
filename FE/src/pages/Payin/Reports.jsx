import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import ChartCard from "../../components/ChartCard";
import PageFilterHeader from "../../components/PageFilterHeader";
import { useTheme } from "../../context/ThemeProvider";
import { getChartTheme } from "../../utils/chartTheme";
import { fetchReportsSummary } from "../../Api";
import { reportFilterSections } from "../../utils/filterPresets";
import { showServerErrorToast } from "../../utils/toast";
import SimpleCardsSection from "../shared/SimpleCardsSection";

function Reports() {
  const { isLight } = useTheme();
  const chartTheme = getChartTheme(isLight);
  const [centerCards, setCenterCards] = useState([]);
  const [salesCards, setSalesCards] = useState([]);
  const [transactionVolume, setTransactionVolume] = useState([]);
  const [revenueOverview, setRevenueOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReportsSummary = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchReportsSummary();
      const data = response.data || {};

      setCenterCards(data.center?.cards || []);
      setSalesCards(data.sales?.cards || []);
      setTransactionVolume(data.sales?.chart?.transactionVolume || []);
      setRevenueOverview(data.merchant?.chart?.revenueOverview || []);
    } catch (error) {
      setCenterCards([]);
      setSalesCards([]);
      setTransactionVolume([]);
      setRevenueOverview([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportsSummary();
  }, [loadReportsSummary]);

  return (
    <section>
      <PageFilterHeader
        title="Reports Summary"
        subtitle="Unified view of report center, sales, and merchant analytics."
        filterSections={reportFilterSections}
      >
        {loading ? (
          <p className="table-empty">Loading reports summary...</p>
        ) : (
          <>
            <SimpleCardsSection
              variant="subsection"
              title="Report Center"
              subtitle="Generate transaction, settlement, revenue, and merchant reports."
              cards={centerCards}
            />

            <SimpleCardsSection
              variant="subsection"
              title="Sales Overview"
              subtitle="Key sales metrics for the selected period."
              cards={salesCards}
            />

            <div className="charts-grid">
              <ChartCard title="Revenue Analytics" subtitle="Daily transaction volume insights">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={transactionVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="day" stroke={chartTheme.axis} />
                    <YAxis stroke={chartTheme.axis} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Bar dataKey="volume" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Merchant Revenue Report" subtitle="Performance and growth analytics">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueOverview}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="name" stroke={chartTheme.axis} />
                    <YAxis stroke={chartTheme.axis} />
                    <Tooltip contentStyle={chartTheme.tooltipStyle} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </PageFilterHeader>
    </section>
  );
}

export default Reports;
