import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

function CompetitorFrequencyBar({ data, theme: passedTheme }) {
  const { theme } = useTheme();
  const t = passedTheme || theme;

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: t.textMuted,
      }}>
        No competitor data available
      </div>
    );
  }

  // Take top 10 competitors
  const chartData = data.slice(0, 10);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ fontWeight: 600, color: t.text }}>
            {data.name}
          </div>
          <div style={{ color: t.orange }}>
            Mentioned {data.count} times
          </div>
        </div>
      );
    }
    return null;
  };

  // Color gradient based on frequency
  const maxCount = Math.max(...chartData.map(d => d.count));
  const getBarColor = (count) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return t.red;
    if (intensity > 0.4) return t.orange;
    return t.yellow;
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 35)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <XAxis
          type="number"
          domain={[0, 'dataMax']}
          tick={{ fill: t.textMuted, fontSize: 11 }}
          axisLine={{ stroke: t.border }}
          tickLine={{ stroke: t.border }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: t.text, fontSize: 12 }}
          axisLine={{ stroke: t.border }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: t.bgHover }} />
        <Bar
          dataKey="count"
          name="Mentions"
          radius={[0, 4, 4, 0]}
          barSize={20}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default CompetitorFrequencyBar;
