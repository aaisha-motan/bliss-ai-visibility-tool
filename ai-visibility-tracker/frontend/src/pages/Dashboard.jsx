import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getClients } from '../services/clientService';
import { getReports } from '../services/reportService';

function Dashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalReports: 0,
    avgVisibility: 0,
    totalPrompts: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, reportsData] = await Promise.all([
        getClients(),
        getReports({ limit: 5 }),
      ]);

      setClients(clientsData);
      setReports(reportsData.reports);

      // Calculate stats
      const totalPrompts = clientsData.reduce((sum, c) => sum + (c.prompts?.length || 0), 0);
      const avgScore = reportsData.reports.length > 0
        ? Math.round(reportsData.reports.reduce((sum, r) => sum + r.overallScore, 0) / reportsData.reports.length)
        : 0;

      setStats({
        totalClients: clientsData.length,
        totalReports: reportsData.pagination.total,
        avgVisibility: avgScore,
        totalPrompts,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  return (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        <StatCard
          label="Active Clients"
          value={stats.totalClients}
          icon="◑"
          color={theme.blue}
          theme={theme}
        />
        <StatCard
          label="Total Reports"
          value={stats.totalReports}
          icon="◓"
          color={theme.orange}
          theme={theme}
        />
        <StatCard
          label="Avg Visibility"
          value={`${stats.avgVisibility}%`}
          icon="◐"
          color={theme.green}
          theme={theme}
        />
        <StatCard
          label="Prompts Tracked"
          value={stats.totalPrompts}
          icon="◒"
          color={theme.yellow}
          theme={theme}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
      }}>
        {/* Recent Reports */}
        <Card
          title="Recent Reports"
          headerAction={
            <Link to="/reports" style={{ color: theme.blue, fontSize: 13 }}>
              View All
            </Link>
          }
          padding={false}
        >
          {reports.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: theme.textMuted,
            }}>
              <p>No reports yet.</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate('/scan')}
                style={{ marginTop: 12 }}
              >
                Run First Scan
              </Button>
            </div>
          ) : (
            <div>
              {reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: `1px solid ${theme.border}`,
                    textDecoration: 'none',
                    color: theme.text,
                    transition: 'background 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {report.client?.name || 'Unknown Client'}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <Badge variant={report.overallScore >= 60 ? 'success' : report.overallScore >= 30 ? 'warning' : 'error'}>
                      {report.overallScore}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Clients Overview */}
        <Card
          title="Clients"
          headerAction={
            <Link to="/clients" style={{ color: theme.blue, fontSize: 13 }}>
              Manage
            </Link>
          }
          padding={false}
        >
          {clients.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: theme.textMuted,
            }}>
              <p>No clients yet.</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate('/clients')}
                style={{ marginTop: 12 }}
              >
                Add First Client
              </Button>
            </div>
          ) : (
            <div>
              {clients.slice(0, 5).map((client) => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: `1px solid ${theme.border}`,
                    textDecoration: 'none',
                    color: theme.text,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: theme.blueGlow,
                      border: `1px solid ${theme.blueBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.blue,
                    }}>
                      {client.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{client.name}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>
                        {client.prompts?.length || 0} prompts
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>
                    {client._count?.reports || 0} reports
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginTop: 24 }}>
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <Button variant="primary" onClick={() => navigate('/scan')}>
            Run New Scan
          </Button>
          <Button onClick={() => navigate('/clients')}>
            Add Client
          </Button>
          <Button onClick={() => navigate('/reports')}>
            View All Reports
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, color, theme }) {
  return (
    <div style={{
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: 16,
      padding: 20,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 13, color: theme.textMuted }}>
          {label}
        </span>
        <span style={{ fontSize: 20, color }}>
          {icon}
        </span>
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: theme.text,
      }}>
        {value}
      </div>
    </div>
  );
}

export default Dashboard;
