import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

function VisibilityPieChart({ data }) {
  const { theme } = useTheme();

  // Filter out zero values
  const filteredData = data.filter(d => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div style={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textMuted,
      }}>
        No data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ color: data.payload.color, fontWeight: 600 }}>
            {data.name}
          </div>
          <div style={{ color: theme.text }}>
            {data.value} responses
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          innerRadius={40}
          dataKey="value"
          paddingAngle={2}
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span style={{ color: theme.text, fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default VisibilityPieChart;
