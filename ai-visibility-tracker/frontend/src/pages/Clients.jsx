import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getClients, createClient, deleteClient } from '../services/clientService';

function Clients() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    location: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const client = await createClient(formData);
      setClients(prev => [client, ...prev]);
      setShowModal(false);
      setFormData({ name: '', domain: '', industry: '', location: '' });
      navigate(`/clients/${client.id}`);
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this client? All reports will also be deleted.')) {
      return;
    }
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete client:', error);
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
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, color: theme.text }}>
            All Clients ({clients.length})
          </h2>
          <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: 13 }}>
            Manage your client profiles and their AI visibility tracking
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Add Client
        </Button>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>◑</div>
            <h3 style={{ margin: '0 0 8px', color: theme.text }}>
              No clients yet
            </h3>
            <p style={{ margin: '0 0 24px', color: theme.textMuted }}>
              Add your first client to start tracking their AI visibility
            </p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Add First Client
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {clients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Card style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '100%',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
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
                    flexShrink: 0,
                  }}>
                    {client.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      color: theme.text,
                    }}>
                      {client.name}
                    </h3>
                    <div style={{
                      fontSize: 13,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}>
                      {client.domain}
                    </div>
                    {(client.industry || client.location) && (
                      <div style={{
                        fontSize: 12,
                        color: theme.textDim,
                        marginTop: 4,
                      }}>
                        {[client.industry, client.location].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: `1px solid ${theme.border}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>
                      PROMPTS
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                      {client.prompts?.length || 0}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>
                      COMPETITORS
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                      {client.competitors?.length || 0}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>
                      REPORTS
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                      {client._count?.reports || 0}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 16,
                }}>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/scan/${client.id}`);
                    }}
                  >
                    Run Scan
                  </Button>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={(e) => handleDelete(client.id, e)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Client"
        footer={
          <>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
            >
              Create Client
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <Input
            label="Company Name *"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Infinity Solar"
            required
            fullWidth
          />
          <Input
            label="Domain *"
            name="domain"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            placeholder="e.g., infinitysolar.com"
            required
            fullWidth
          />
          <Input
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            placeholder="e.g., Solar Energy"
            fullWidth
          />
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Orange County, CA"
            fullWidth
          />
        </form>
      </Modal>
    </div>
  );
}

export default Clients;
