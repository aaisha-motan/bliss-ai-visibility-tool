import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getClients, getClient } from '../services/clientService';
import { startScan, pollScanStatus } from '../services/scanService';
import { engines } from '../theme';

function Scan() {
  const { clientId: paramClientId } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(paramClientId || '');
  const [selectedClient, setSelectedClient] = useState(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientDetails(selectedClientId);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
      if (paramClientId) {
        setSelectedClientId(paramClientId);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClientDetails = async (id) => {
    try {
      const data = await getClient(id);
      setSelectedClient(data);
    } catch (err) {
      console.error('Failed to load client:', err);
    }
  };

  const handleStartScan = async () => {
    if (!selectedClientId) return;

    setScanning(true);
    setError(null);
    setScanStatus({ status: 'STARTING', progress: 0, currentStep: 'Initializing...' });

    try {
      const result = await startScan(selectedClientId);
      const scanId = result.scan.id;

      // Start polling for status
      const stopPolling = pollScanStatus(scanId, (status) => {
        setScanStatus(status);

        if (status.status === 'COMPLETED') {
          setScanning(false);
          // Navigate to report after short delay
          setTimeout(() => {
            if (status.reportId) {
              navigate(`/reports/${status.reportId}`);
            }
          }, 1500);
        } else if (status.status === 'FAILED') {
          setScanning(false);
          setError(status.error || 'Scan failed');
        }
      });

      // Store stop function for cleanup if needed
      return () => stopPolling();
    } catch (err) {
      setScanning(false);
      setError(err.response?.data?.error || 'Failed to start scan');
      setScanStatus(null);
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Client Selection */}
      <Card title="Select Client" style={{ marginBottom: 24 }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <p style={{ color: theme.textMuted }}>No clients yet.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/clients')}
              style={{ marginTop: 12 }}
            >
              Add Client First
            </Button>
          </div>
        ) : (
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={scanning}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              color: theme.text,
              background: theme.bgInput,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              cursor: scanning ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.prompts?.length || 0} prompts)
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Client Preview */}
      {selectedClient && (
        <Card title="Scan Configuration" style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: theme.blueGlow,
              border: `1px solid ${theme.blueBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: theme.blue,
            }}>
              {selectedClient.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                {selectedClient.name}
              </div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>
                {selectedClient.domain}
              </div>
            </div>
          </div>

          {/* Prompts to scan */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.textMuted,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}>
              Prompts to Scan ({selectedClient.prompts?.length || 0})
            </div>
            {(!selectedClient.prompts || selectedClient.prompts.length === 0) ? (
              <div style={{
                padding: 16,
                background: theme.yellowBg,
                border: `1px solid ${theme.yellowBg}`,
                borderRadius: 8,
                color: theme.yellow,
                fontSize: 13,
              }}>
                No prompts configured. Add prompts to the client before scanning.
                <Button
                  size="small"
                  onClick={() => navigate(`/clients/${selectedClientId}`)}
                  style={{ marginLeft: 12 }}
                >
                  Add Prompts
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedClient.prompts.slice(0, 5).map((prompt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      background: theme.bg,
                      borderRadius: 6,
                      fontSize: 13,
                      color: theme.text,
                    }}
                  >
                    "{prompt}"
                  </div>
                ))}
                {selectedClient.prompts.length > 5 && (
                  <div style={{ fontSize: 12, color: theme.textMuted }}>
                    + {selectedClient.prompts.length - 5} more prompts
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Engines */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.textMuted,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}>
              AI Engines
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {engines.map((engine) => (
                <div
                  key={engine.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: engine.color, fontSize: 16 }}>
                    {engine.icon}
                  </span>
                  <span style={{ fontSize: 13, color: theme.text }}>
                    {engine.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Competitors tracked */}
          {selectedClient.competitors?.length > 0 && (
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.textMuted,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
                Competitors Tracked ({selectedClient.competitors.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedClient.competitors.map((comp, i) => (
                  <Badge key={i} variant="warning">
                    {comp}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Scan Progress */}
      {scanStatus && (
        <Card
          title={
            scanStatus.status === 'COMPLETED'
              ? 'Scan Complete!'
              : scanStatus.status === 'FAILED'
              ? 'Scan Failed'
              : 'Scanning...'
          }
          style={{ marginBottom: 24 }}
        >
          {/* Progress Bar */}
          <div style={{
            height: 8,
            background: theme.border,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div
              style={{
                height: '100%',
                width: `${scanStatus.progress || 0}%`,
                background: scanStatus.status === 'FAILED'
                  ? theme.red
                  : scanStatus.status === 'COMPLETED'
                  ? theme.green
                  : `linear-gradient(90deg, ${theme.blue}, ${theme.orange})`,
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ color: theme.text }}>
              {scanStatus.currentStep || 'Processing...'}
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: scanStatus.status === 'COMPLETED' ? theme.green : theme.blue,
            }}>
              {scanStatus.progress || 0}%
            </div>
          </div>

          {scanStatus.status === 'COMPLETED' && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: theme.greenBg,
              borderRadius: 8,
              color: theme.green,
              textAlign: 'center',
            }}>
              Scan completed successfully! Redirecting to report...
            </div>
          )}
        </Card>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: 16,
          marginBottom: 24,
          background: theme.redBg,
          border: `1px solid rgba(248, 81, 73, 0.2)`,
          borderRadius: 8,
          color: theme.red,
        }}>
          {error}
        </div>
      )}

      {/* Start Scan Button */}
      {selectedClient && !scanning && scanStatus?.status !== 'COMPLETED' && (
        <Button
          variant="primary"
          onClick={handleStartScan}
          disabled={!selectedClient.prompts?.length}
          fullWidth
          style={{ padding: '16px 24px', fontSize: 16 }}
        >
          Start Scan ({selectedClient.prompts?.length || 0} prompts × 3 engines)
        </Button>
      )}
    </div>
  );
}

export default Scan;
