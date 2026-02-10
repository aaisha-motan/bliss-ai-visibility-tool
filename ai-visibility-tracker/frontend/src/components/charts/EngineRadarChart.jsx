import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { engines } from '../../theme';

function EngineRadarChart({ engineStats }) {
  const { theme } = useTheme();

  // Transform engine stats into radar chart data
  const data = engines.map((engine) => {
    const stats = engineStats?.[engine.id] || {};
    const featured = stats.featured || 0;
    const mentioned = stats.mentioned || 0;
    const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
    const visibilityRate = Math.round(((featured + mentioned) / total) * 100);
    const featuredRate = Math.round((featured / total) * 100);

    return {
      engine: engine.name,
      visibility: visibilityRate,
      featured: featuredRate,
      fullMark: 100,
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ fontWeight: 600, color: theme.text, marginBottom: 4 }}>
            {data.engine}
          </div>
          <div style={{ fontSize: 12, color: theme.green }}>
            Visibility: {data.visibility}%
          </div>
          <div style={{ fontSize: 12, color: theme.blue }}>
            Featured: {data.featured}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke={theme.border} />
        <PolarAngleAxis
          dataKey="engine"
          tick={{ fill: theme.text, fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: theme.textMuted, fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="Visibility"
          dataKey="visibility"
          stroke={theme.green}
          fill={theme.green}
          fillOpacity={0.3}
        />
        <Radar
          name="Featured"
          dataKey="featured"
          stroke={theme.blue}
          fill={theme.blue}
          fillOpacity={0.3}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default EngineRadarChart;
