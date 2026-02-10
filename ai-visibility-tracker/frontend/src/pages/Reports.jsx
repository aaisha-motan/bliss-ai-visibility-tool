import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getReports, deleteReport } from '../services/reportService';
import { getClients } from '../services/clientService';

function Reports() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(clientIdFilter || '');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

  useEffect(() => {
    loadData();
  }, [selectedClientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, clientsData] = await Promise.all([
        getReports({ clientId: selectedClientId || undefined, limit: 20 }),
        getClients(),
      ]);
      setReports(reportsData.reports);
      setPagination(reportsData.pagination);
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 60) return theme.green;
    if (score >= 30) return theme.yellow;
    return theme.red;
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

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, color: theme.text }}>
            All Reports ({pagination.total})
          </h2>
          <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: 13 }}>
            View and analyze AI visibility scan results
          </p>
        </div>

        {/* Client Filter */}
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          style={{
            padding: '10px 16px',
            fontSize: 13,
            color: theme.text,
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            minWidth: 200,
          }}
        >
          <option value="">All Clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>◓</div>
            <h3 style={{ margin: '0 0 8px', color: theme.text }}>
              No reports yet
            </h3>
            <p style={{ margin: '0 0 24px', color: theme.textMuted }}>
              Run a scan to generate your first report
            </p>
            <Link to="/scan">
              <Button variant="primary">Run Scan</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reports.map((report) => (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Card style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Score Circle */}
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: theme.bg,
                      border: `3px solid ${getScoreColor(report.overallScore)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}>
                      <span style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: getScoreColor(report.overallScore),
                      }}>
                        {report.overallScore}
                      </span>
                      <span style={{ fontSize: 10, color: theme.textMuted }}>
                        score
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                        {report.client?.name || 'Unknown Client'}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                        {report.client?.domain}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>
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

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                  }}>
                    {/* Stats */}
                    <div style={{
                      display: 'flex',
                      gap: 16,
                      padding: '12px 16px',
                      background: theme.bg,
                      borderRadius: 8,
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: theme.green }}>
                          {report.featuredCount}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          Featured
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: theme.yellow }}>
                          {report.mentionedCount}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          Mentioned
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: theme.red }}>
                          {report.competitorOnlyCount}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          Competitor
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: theme.gray }}>
                          {report.notFoundCount}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          Not Found
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(report.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reports;
