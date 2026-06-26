import { useCallback, useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ChartCard from "../../components/ChartCard";
import PageFilterHeader from "../../components/PageFilterHeader";
import { useTheme } from "../../context/ThemeProvider";
import { getChartTheme } from "../../utils/chartTheme";
import { fetchReportsMerchant } from "../../Api";
import { showServerErrorToast } from "../../utils/toast";
import { reportFilterSections } from "../../utils/filterPresets";

function MerchantReport() {
  const { isLight } = useTheme();
  const chartTheme = getChartTheme(isLight);
  const [revenueOverview, setRevenueOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMerchantReport = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchReportsMerchant();
      setRevenueOverview(response.data?.chart?.revenueOverview || []);
    } catch (error) {
      setRevenueOverview([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMerchantReport();
  }, [loadMerchantReport]);

  return (
    <section>
      <PageFilterHeader
        title="Merchant Report"
        subtitle="Performance and growth analytics with export-ready reporting view."
        filterSections={reportFilterSections}
      >
        <ChartCard title="Merchant Revenue Report" subtitle="Date filter and export actions can be plugged in">
          {loading ? (
            <p>Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </PageFilterHeader>
    </section>
  );
}

export default MerchantReport;
