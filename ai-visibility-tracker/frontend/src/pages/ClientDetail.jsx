import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  getClient,
  updateClient,
  addPrompts,
  removePrompt,
  addCompetitors,
  removeCompetitor,
} from '../services/clientService';
import PromptGenerator from '../components/clients/PromptGenerator';

function ClientDetail() {
  const { id } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Prompt/Competitor modals
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const data = await getClient(id);
      setClient(data);
      setFormData({
        name: data.name,
        domain: data.domain,
        industry: data.industry || '',
        location: data.location || '',
      });
    } catch (error) {
      console.error('Failed to load client:', error);
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateClient(id, formData);
      setClient(prev => ({ ...prev, ...updated }));
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.trim()) return;
    setSaving(true);
    try {
      const updated = await addPrompts(id, [newPrompt.trim()]);
      setClient(prev => ({ ...prev, prompts: updated.prompts }));
      setNewPrompt('');
      setShowPromptModal(false);
    } catch (error) {
      console.error('Failed to add prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePrompt = async (index) => {
    try {
      const updated = await removePrompt(id, index);
      setClient(prev => ({ ...prev, prompts: updated.prompts }));
    } catch (error) {
      console.error('Failed to remove prompt:', error);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.trim()) return;
    setSaving(true);
    try {
      const updated = await addCompetitors(id, [newCompetitor.trim()]);
      setClient(prev => ({ ...prev, competitors: updated.competitors }));
      setNewCompetitor('');
      setShowCompetitorModal(false);
    } catch (error) {
      console.error('Failed to add competitor:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCompetitor = async (index) => {
    try {
      const updated = await removeCompetitor(id, index);
      setClient(prev => ({ ...prev, competitors: updated.competitors }));
    } catch (error) {
      console.error('Failed to remove competitor:', error);
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

  if (!client) return null;

  return (
    <div>
      {/* Back Link */}
      <Link
        to="/clients"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: theme.textMuted,
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        ← Back to Clients
      </Link>

      {/* Client Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: theme.blueGlow,
              border: `1px solid ${theme.blueBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: theme.blue,
            }}>
              {client.name[0]}
            </div>
            <div>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Company Name"
                    containerStyle={{ marginBottom: 0 }}
                  />
                  <Input
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="Domain"
                    containerStyle={{ marginBottom: 0 }}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Input
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="Industry"
                      containerStyle={{ marginBottom: 0 }}
                    />
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                      containerStyle={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ margin: 0, fontSize: 24, color: theme.text }}>
                    {client.name}
                  </h2>
                  <div style={{ color: theme.textMuted, marginTop: 4 }}>
                    {client.domain}
                  </div>
                  {(client.industry || client.location) && (
                    <div style={{ color: theme.textDim, fontSize: 13, marginTop: 4 }}>
                      {[client.industry, client.location].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditMode(true)}>Edit</Button>
                <Button variant="primary" onClick={() => navigate(`/scan/${id}`)}>
                  Run Scan
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
      }}>
        {/* Prompts */}
        <Card
          title="Search Prompts"
          subtitle={`${client.prompts?.length || 0} prompts configured`}
          headerAction={
            <div style={{ display: 'flex', gap: 8 }}>
              <PromptGenerator
                clientId={id}
                clientLocation={client.location}
                onPromptsAdded={loadClient}
              />
              <Button size="small" onClick={() => setShowPromptModal(true)}>
                + Add
              </Button>
            </div>
          }
        >
          {(!client.prompts || client.prompts.length === 0) ? (
            <div style={{
              textAlign: 'center',
              padding: 24,
              color: theme.textMuted,
            }}>
              <p>No prompts yet. Add prompts that users might ask AI about your client.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {client.prompts.map((prompt, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: theme.bg,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ fontSize: 13, color: theme.text }}>
                    "{prompt}"
                  </span>
                  <button
                    onClick={() => handleRemovePrompt(index)}
                    style={{
                      padding: 4,
                      border: 'none',
                      background: 'transparent',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Competitors */}
        <Card
          title="Competitors"
          subtitle={`${client.competitors?.length || 0} competitors tracked`}
          headerAction={
            <Button size="small" onClick={() => setShowCompetitorModal(true)}>
              + Add
            </Button>
          }
        >
          {(!client.competitors || client.competitors.length === 0) ? (
            <div style={{
              textAlign: 'center',
              padding: 24,
              color: theme.textMuted,
            }}>
              <p>No competitors yet. Add competitors to track gap analysis.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {client.competitors.map((competitor, index) => (
                <div
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: theme.orangeGlow,
                    border: `1px solid ${theme.orangeBorder}`,
                    borderRadius: 20,
                    color: theme.orange,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {competitor}
                  <button
                    onClick={() => handleRemoveCompetitor(index)}
                    style={{
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Reports */}
      <Card
        title="Recent Reports"
        style={{ marginTop: 24 }}
        headerAction={
          client.reports?.length > 0 && (
            <Link to={`/reports?clientId=${id}`} style={{ color: theme.blue, fontSize: 13 }}>
              View All
            </Link>
          )
        }
        padding={false}
      >
        {(!client.reports || client.reports.length === 0) ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: theme.textMuted,
          }}>
            <p>No reports yet. Run a scan to generate the first report.</p>
            <Button
              variant="primary"
              size="small"
              onClick={() => navigate(`/scan/${id}`)}
              style={{ marginTop: 12 }}
            >
              Run Scan
            </Button>
          </div>
        ) : (
          <div>
            {client.reports.map((report) => (
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
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: theme.textMuted }}>
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right', fontSize: 12, color: theme.textMuted }}>
                    <span style={{ color: theme.green }}>{report.featuredCount} featured</span>
                    {' • '}
                    <span style={{ color: theme.yellow }}>{report.mentionedCount} mentioned</span>
                    {' • '}
                    <span style={{ color: theme.gray }}>{report.notFoundCount} not found</span>
                  </div>
                  <Badge
                    variant={report.overallScore >= 60 ? 'success' : report.overallScore >= 30 ? 'warning' : 'error'}
                  >
                    {report.overallScore}%
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Add Prompt Modal */}
      <Modal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        title="Add Search Prompt"
        footer={
          <>
            <Button onClick={() => setShowPromptModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddPrompt} loading={saving}>
              Add Prompt
            </Button>
          </>
        }
      >
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
          Enter a search query that users might ask AI platforms about your client's industry or services.
        </p>
        <Input
          label="Search Prompt"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          placeholder="e.g., best solar company in Orange County"
          fullWidth
        />
      </Modal>

      {/* Add Competitor Modal */}
      <Modal
        isOpen={showCompetitorModal}
        onClose={() => setShowCompetitorModal(false)}
        title="Add Competitor"
        footer={
          <>
            <Button onClick={() => setShowCompetitorModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCompetitor} loading={saving}>
              Add Competitor
            </Button>
          </>
        }
      >
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
          Enter a competitor name to track in AI responses.
        </p>
        <Input
          label="Competitor Name"
          value={newCompetitor}
          onChange={(e) => setNewCompetitor(e.target.value)}
          placeholder="e.g., SunPower"
          fullWidth
        />
      </Modal>
    </div>
  );
}

export default ClientDetail;
