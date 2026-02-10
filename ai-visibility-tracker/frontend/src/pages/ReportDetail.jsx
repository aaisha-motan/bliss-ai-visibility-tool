import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import VisibilityPieChart from '../components/charts/VisibilityPieChart';
import EngineRadarChart from '../components/charts/EngineRadarChart';
import GapAnalysisBar from '../components/charts/GapAnalysisBar';
import CompetitorFrequencyBar from '../components/charts/CompetitorFrequencyBar';
import { getReport } from '../services/reportService';
import { exportReportToPdf } from '../utils/pdfExport';
import { engines, getMentionColor, getMentionBg, mentionTypes } from '../theme';

function ReportDetail() {
  const { id } = useParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const data = await getReport(id);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportReportToPdf(report, {
        filename: `${report.client.name}-ai-visibility-report`,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
      }}>
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: theme.text }}>Report not found</h2>
        <Link to="/reports">
          <Button variant="primary">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'prompts', label: 'Prompt Results' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'competitors', label: 'Competitors' },
  ];

  return (
    <div id="report-content">
      {/* Back Link */}
      <Link
        to="/reports"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: theme.textMuted,
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        ← Back to Reports
      </Link>

      {/* Report Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Score Circle */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `conic-gradient(${
                report.overallScore >= 60 ? theme.green : report.overallScore >= 30 ? theme.yellow : theme.red
              } ${report.overallScore * 3.6}deg, ${theme.border} 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: theme.bgCard,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <span style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: theme.text,
                }}>
                  {report.overallScore}
                </span>
                <span style={{ fontSize: 10, color: theme.textMuted }}>
                  score
                </span>
              </div>
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: 22, color: theme.text }}>
                {report.client.name}
              </h2>
              <div style={{ color: theme.textMuted, marginTop: 4 }}>
                {report.client.domain}
              </div>
              <div style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>
                Generated on{' '}
                {new Date(report.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleExportPdf}
            loading={exporting}
          >
            Export PDF
          </Button>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 24,
          paddingTop: 24,
          borderTop: `1px solid ${theme.border}`,
        }}>
          <QuickStat
            label="Featured"
            value={report.featuredCount}
            color={theme.green}
            total={report.promptCount * 3}
            theme={theme}
          />
          <QuickStat
            label="Mentioned"
            value={report.mentionedCount}
            color={theme.yellow}
            total={report.promptCount * 3}
            theme={theme}
          />
          <QuickStat
            label="Competitor Only"
            value={report.competitorOnlyCount}
            color={theme.red}
            total={report.promptCount * 3}
            theme={theme}
          />
          <QuickStat
            label="Not Found"
            value={report.notFoundCount}
            color={theme.gray}
            total={report.promptCount * 3}
            theme={theme}
          />
        </div>
      </Card>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: 8,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === tab.id ? theme.blue : theme.textMuted,
              background: activeTab === tab.id ? theme.blueGlow : 'transparent',
              border: `1px solid ${activeTab === tab.id ? theme.blueBorder : 'transparent'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab report={report} theme={theme} />
      )}
      {activeTab === 'prompts' && (
        <PromptsTab
          report={report}
          theme={theme}
          expandedPrompt={expandedPrompt}
          setExpandedPrompt={setExpandedPrompt}
        />
      )}
      {activeTab === 'gaps' && (
        <GapsTab report={report} theme={theme} />
      )}
      {activeTab === 'competitors' && (
        <CompetitorsTab report={report} theme={theme} />
      )}
    </div>
  );
}

function QuickStat({ label, value, color, total, theme }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div style={{
      padding: 16,
      background: theme.bg,
      borderRadius: 12,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
      }}>
        <span style={{ fontSize: 28, fontWeight: 700, color }}>
          {value}
        </span>
        <span style={{ fontSize: 14, color: theme.textMuted }}>
          / {total}
        </span>
      </div>
      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
        {label} ({percentage}%)
      </div>
    </div>
  );
}

function OverviewTab({ report, theme }) {
  const chartData = [
    { name: 'Featured', value: report.featuredCount, color: theme.green },
    { name: 'Mentioned', value: report.mentionedCount, color: theme.yellow },
    { name: 'Competitor Only', value: report.competitorOnlyCount, color: theme.red },
    { name: 'Not Found', value: report.notFoundCount, color: theme.gray },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
    }}>
      {/* Visibility Distribution */}
      <Card title="Visibility Distribution">
        <VisibilityPieChart data={chartData} />
      </Card>

      {/* Engine Performance */}
      <Card title="Engine Performance">
        <EngineRadarChart engineStats={report.engineStats} />
      </Card>

      {/* Executive Summary */}
      <Card title="Executive Summary" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h4 style={{ margin: '0 0 12px', color: theme.text }}>Key Findings</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: theme.textMuted, lineHeight: 1.8 }}>
              <li>
                <strong style={{ color: theme.text }}>{report.promptCount} prompts</strong> were scanned across 3 AI engines
              </li>
              <li>
                Brand was <strong style={{ color: theme.green }}>featured in {report.featuredCount}</strong> responses
              </li>
              <li>
                <strong style={{ color: report.bestEngine === 'CHATGPT' ? '#10A37F' : report.bestEngine === 'PERPLEXITY' ? '#20B2AA' : '#4285F4' }}>
                  {report.bestEngine?.replace('_', ' ')}
                </strong> shows best visibility
              </li>
              {report.newCompetitorsDetected?.length > 0 && (
                <li>
                  <strong style={{ color: theme.orange }}>{report.newCompetitorsDetected.length}</strong> new competitors detected
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 style={{ margin: '0 0 12px', color: theme.text }}>Engine Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {engines.map((engine) => {
                const stats = report.engineStats?.[engine.id];
                const visible = (stats?.featured || 0) + (stats?.mentioned || 0);
                const total = Object.values(stats || {}).reduce((a, b) => a + b, 0);
                const rate = total > 0 ? Math.round((visible / total) * 100) : 0;

                return (
                  <div key={engine.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ color: engine.color, fontSize: 18 }}>{engine.icon}</span>
                    <span style={{ flex: 1, color: theme.text }}>{engine.name}</span>
                    <div style={{
                      width: 100,
                      height: 8,
                      background: theme.border,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${rate}%`,
                        height: '100%',
                        background: engine.color,
                        borderRadius: 4,
                      }} />
                    </div>
                    <span style={{ color: theme.textMuted, fontSize: 13, width: 40 }}>
                      {rate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PromptsTab({ report, theme, expandedPrompt, setExpandedPrompt }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {report.promptResults.map((pr, index) => (
        <Card key={pr.id} padding={false}>
          {/* Prompt Header */}
          <div
            onClick={() => setExpandedPrompt(expandedPrompt === index ? null : index)}
            style={{
              padding: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.text,
              }}>
                "{pr.prompt}"
              </div>
              <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 8,
              }}>
                {pr.engineResults.map((er) => {
                  const engine = engines.find(e => e.id === er.engine);
                  return (
                    <div
                      key={er.engine}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: engine?.color }}>{engine?.icon}</span>
                      <Badge mentionType={er.mentionType} size="small">
                        {mentionTypes[er.mentionType]?.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
            <span style={{
              color: theme.textMuted,
              transform: expandedPrompt === index ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}>
              ▼
            </span>
          </div>

          {/* Expanded Content */}
          {expandedPrompt === index && (
            <div style={{
              padding: '0 20px 20px',
              borderTop: `1px solid ${theme.border}`,
            }}>
              {pr.engineResults.map((er) => {
                const engine = engines.find(e => e.id === er.engine);
                return (
                  <div
                    key={er.id}
                    style={{
                      marginTop: 20,
                      padding: 16,
                      background: theme.bg,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: engine?.color, fontSize: 20 }}>{engine?.icon}</span>
                        <span style={{ fontWeight: 600, color: theme.text }}>{engine?.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {er.rankingPosition && (
                          <span style={{ fontSize: 12, color: theme.textMuted }}>
                            Position: #{er.rankingPosition}
                          </span>
                        )}
                        <Badge mentionType={er.mentionType}>
                          {mentionTypes[er.mentionType]?.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Response Text */}
                    <div style={{
                      padding: 16,
                      background: theme.bgCard,
                      borderRadius: 8,
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: theme.text,
                      whiteSpace: 'pre-wrap',
                      maxHeight: 400,
                      overflowY: 'auto',
                    }}>
                      {er.responseText}
                    </div>

                    {/* Screenshot */}
                    {er.screenshotPath && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{
                          fontSize: 11,
                          color: theme.textMuted,
                          marginBottom: 8,
                        }}>
                          Screenshot:
                        </div>
                        <img
                          src={`/api/screenshots/${er.screenshotPath}`}
                          alt={`${engine?.name} screenshot`}
                          style={{
                            maxWidth: '100%',
                            borderRadius: 8,
                            border: `1px solid ${theme.border}`,
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(`/api/screenshots/${er.screenshotPath}`, '_blank')}
                        />
                      </div>
                    )}

                    {/* Competitors Mentioned */}
                    {er.competitorsMentioned?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: 11, color: theme.textMuted }}>
                          Competitors mentioned:{' '}
                        </span>
                        {er.competitorsMentioned.map((c, i) => (
                          <Badge key={i} variant="warning" size="small" style={{ marginLeft: 4 }}>
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function GapsTab({ report, theme }) {
  // Calculate gap data from prompt results
  const gapData = report.promptResults.map(pr => {
    const clientVisible = pr.engineResults.filter(
      er => er.mentionType === 'FEATURED' || er.mentionType === 'MENTIONED'
    ).length;
    const competitorMentions = pr.engineResults.reduce(
      (sum, er) => sum + (er.competitorsMentioned?.length || 0), 0
    );
    const hasGap = competitorMentions > 0 && clientVisible < 3;

    return {
      prompt: pr.prompt.substring(0, 50) + (pr.prompt.length > 50 ? '...' : ''),
      clientVisibility: clientVisible,
      competitorMentions,
      gapScore: hasGap ? competitorMentions - clientVisible : 0,
      hasGap,
    };
  });

  const alertGaps = gapData.filter(g => g.hasGap);

  return (
    <div>
      {alertGaps.length > 0 && (
        <Card
          title="Gap Alerts"
          style={{ marginBottom: 24, borderColor: theme.red }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alertGaps.map((gap, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  background: theme.redBg,
                  borderRadius: 8,
                  border: `1px solid rgba(248, 81, 73, 0.2)`,
                }}
              >
                <div style={{ fontWeight: 600, color: theme.red, marginBottom: 4 }}>
                  Visibility Gap Detected
                </div>
                <div style={{ fontSize: 13, color: theme.text }}>
                  "{gap.prompt}"
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                  Competitors mentioned {gap.competitorMentions} times while brand visible in only {gap.clientVisibility}/3 engines
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Gap Analysis by Prompt">
        <GapAnalysisBar data={gapData} theme={theme} />
      </Card>
    </div>
  );
}

function CompetitorsTab({ report, theme }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24,
    }}>
      {/* Competitor Frequency */}
      <Card title="Competitor Frequency">
        {report.competitorData?.length > 0 ? (
          <CompetitorFrequencyBar data={report.competitorData} theme={theme} />
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: theme.textMuted }}>
            No competitors detected in responses
          </div>
        )}
      </Card>

      {/* New Competitors */}
      <Card title="New Competitors Detected">
        {report.newCompetitorsDetected?.length > 0 ? (
          <div>
            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
              These competitors were discovered in AI responses but weren't in your original list.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {report.newCompetitorsDetected.map((comp, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 16px',
                    background: theme.orangeGlow,
                    border: `1px solid ${theme.orangeBorder}`,
                    borderRadius: 8,
                    color: theme.orange,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {comp}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: theme.textMuted }}>
            No new competitors detected
          </div>
        )}
      </Card>
    </div>
  );
}

export default ReportDetail;
