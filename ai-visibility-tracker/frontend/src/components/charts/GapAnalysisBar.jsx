import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

function GapAnalysisBar({ data, theme: passedTheme }) {
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
        No gap data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          maxWidth: 280,
        }}>
          <div style={{ fontWeight: 600, color: t.text, marginBottom: 8, fontSize: 12 }}>
            {data.prompt}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: t.textMuted }}>Client Visibility</div>
              <div style={{ fontWeight: 600, color: t.green }}>
                {data.clientVisibility}/3 engines
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: t.textMuted }}>Competitor Mentions</div>
              <div style={{ fontWeight: 600, color: t.orange }}>
                {data.competitorMentions} times
              </div>
            </div>
          </div>
          {data.hasGap && (
            <div style={{
              marginTop: 8,
              padding: '4px 8px',
              background: t.redBg,
              borderRadius: 4,
              color: t.red,
              fontSize: 11,
            }}>
              Gap detected: Competitors visible where client is not
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
      <BarChart
        data={data}
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
          dataKey="prompt"
          width={150}
          tick={{ fill: t.text, fontSize: 11 }}
          axisLine={{ stroke: t.border }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: t.bgHover }} />
        <ReferenceLine x={0} stroke={t.border} />
        <Bar
          dataKey="clientVisibility"
          name="Client Visibility"
          fill={t.green}
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
        <Bar
          dataKey="competitorMentions"
          name="Competitor Mentions"
          fill={t.orange}
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GapAnalysisBar;
