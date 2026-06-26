import { useCallback, useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ChartCard from "../../components/ChartCard";
import PageFilterHeader from "../../components/PageFilterHeader";
import { useTheme } from "../../context/ThemeProvider";
import { getChartTheme } from "../../utils/chartTheme";
import { fetchReportsSales } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";
import SimpleCardsSection from "../shared/SimpleCardsSection";
import { reportFilterSections } from "../../utils/filterPresets";

function SalesReport() {
  const { isLight } = useTheme();
  const chartTheme = getChartTheme(isLight);
  const [cards, setCards] = useState([]);
  const [transactionVolume, setTransactionVolume] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSalesReport = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchReportsSales();
      setCards(response.data?.cards || []);
      setTransactionVolume(response.data?.chart?.transactionVolume || []);
    } catch (error) {
      setCards([]);
      setTransactionVolume([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesReport();
  }, [loadSalesReport]);

  return (
    <section>
      <PageFilterHeader
        title="Sales Report"
        subtitle="Daily, weekly, monthly sales and payment method performance."
        filterSections={reportFilterSections}
      >
        <SimpleCardsSection
          variant="subsection"
          title="Sales Overview"
          subtitle="Key sales metrics for the selected period."
          cards={cards}
          loading={loading}
        />
        <ChartCard title="Revenue Analytics" subtitle="Daily transaction volume insights">
          {loading ? (
            <p>Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={transactionVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Bar dataKey="volume" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </PageFilterHeader>
    </section>
  );
}

export default SalesReport;
