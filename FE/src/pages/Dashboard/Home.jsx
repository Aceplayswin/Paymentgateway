import { useCallback, useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import StatCard from "../../components/StatCard";
import ChartCard from "../../components/ChartCard";
import DataTable from "../../components/DataTable";
import { useTheme } from "../../context/ThemeProvider";
import { getChartTheme } from "../../utils/chartTheme";
import { fetchDashboardSummary } from "../../Api";
import { getUserRole } from "../../utils/authStorage";
import { showServerErrorToast } from "../../utils/toast";

const iconMap = [
  <FiDollarSign key="a" />,
  <FiTrendingUp key="b" />,
  <FiCheckCircle key="c" />,
  <FiAlertTriangle key="d" />,
  <FiClock key="e" />,
  <FiCreditCard key="f" />,
  <FiRefreshCw key="g" />,
  <FiBarChart2 key="h" />,
];

const pieColors = ["#2563EB", "#7C3AED", "#60A5FA", "#1D4ED8"];
const sfColors = ["#10B981", "#EF4444"];

const emptyCharts = {
  revenueOverview: [],
  transactionVolume: [],
  methodMix: [],
  successFailure: [],
  settlementTrend: [],
  monthlyRevenue: [],
};

function Home() {
  const userRole = getUserRole();
  const isHoldingAdminRole = userRole === "admin";
  const { isLight } = useTheme();
  const chartTheme = getChartTheme(isLight);
  const [stats, setStats] = useState([]);
  const [charts, setCharts] = useState(emptyCharts);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetchDashboardSummary();
      const data = response.data || {};

      setStats(data.stats || []);
      setCharts({
        revenueOverview: data.charts?.revenueOverview || [],
        transactionVolume: data.charts?.transactionVolume || [],
        methodMix: data.charts?.methodMix || [],
        successFailure: data.charts?.successFailure || [],
        settlementTrend: data.charts?.settlementTrend || [],
        monthlyRevenue: data.charts?.monthlyRevenue || [],
      });
      setRecentTransactions(data.recentTransactions || []);
    } catch (error) {
      setStats([]);
      setCharts(emptyCharts);
      setRecentTransactions([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <section className="dashboard-home">
      <header className="content-header">
        <div>
          <h1>{isHoldingAdminRole ? "Platform Command Center" : "Merchant Command Center"}</h1>
          <p>
            {isHoldingAdminRole
              ? "System-wide metrics, multi-merchant transaction flows, and operational analytics."
              : "Comprehensive analytics for payin, payout, settlements, and risk metrics."}
          </p>
        </div>
      </header>

      {loading ? (
        <p className="table-empty">Loading dashboard...</p>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((item, index) => (
              <StatCard key={item.title} {...item} icon={iconMap[index % iconMap.length]} />
            ))}
          </div>

          <div className="charts-grid">
            <ChartCard
              title="Revenue Overview"
              subtitle={isHoldingAdminRole ? "Platform-wide revenue vs settlements" : "Revenue vs settlements across months"}
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={charts.revenueOverview}>
                  <defs>
                    <linearGradient id="revA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="name" stroke={chartTheme.axis} />
                  <YAxis stroke={chartTheme.axis} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revA)" />
                  <Area type="monotone" dataKey="settlements" stroke="#7C3AED" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Daily Transaction Volume"
              subtitle={isHoldingAdminRole ? "Global transaction volume trend" : "Last 7 days volume trend"}
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts.transactionVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="day" stroke={chartTheme.axis} />
                  <YAxis stroke={chartTheme.axis} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Bar dataKey="volume" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="UPI vs Cards vs Wallets" subtitle="Payment method distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={charts.methodMix} dataKey="value" nameKey="name" outerRadius={95}>
                    {charts.methodMix.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Success vs Failed Payments" subtitle="Health of transaction processing">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={charts.successFailure} dataKey="value" nameKey="name" outerRadius={95}>
                    {charts.successFailure.map((entry, index) => (
                      <Cell key={entry.name} fill={sfColors[index % sfColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Settlement Trend" subtitle="Weekly settled vs delayed settlements">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts.settlementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="name" stroke={chartTheme.axis} />
                  <YAxis stroke={chartTheme.axis} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Legend />
                  <Bar dataKey="settled" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="delayed" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Revenue Graph" subtitle="Growth trajectory overview">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={charts.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="month" stroke={chartTheme.axis} />
                  <YAxis stroke={chartTheme.axis} />
                  <Tooltip contentStyle={chartTheme.tooltipStyle} />
                  <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <DataTable
            title={isHoldingAdminRole ? "Recent Platform Transactions" : "Recent Transactions"}
            rows={recentTransactions}
            columns={[
              { key: "transactionId", label: "Transaction ID" },
              { key: "customer", label: "Customer" },
              isHoldingAdminRole ? { key: "merchant", label: "Merchant" } : null,
              { key: "amount", label: "Amount" },
              { key: "method", label: "Payment Method" },
              { key: "status", label: "Status", type: "badge" },
              { key: "timestamp", label: "Timestamp" },
            ].filter(Boolean)}
            searchableKeys={["transactionId", "customer", "merchant", "method", "status"]}
            filterKey="status"
            filterOptions={[
              { value: "success", label: "Success" },
              { value: "failed", label: "Failed" },
              { value: "pending", label: "Pending" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
        </>
      )}
    </section>
  );
}

export default Home;
