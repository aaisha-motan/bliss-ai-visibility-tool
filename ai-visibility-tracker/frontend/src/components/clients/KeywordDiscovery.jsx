/**
 * Keyword Discovery Component
 * Discovers what keywords/prompts a client is already ranking for in AI platforms
 *
 * NEW FILE - Added February 17, 2026
 * Purpose: Address Rich's request "How do we find keywords that we're ranking well for?"
 */

import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { discoverKeywords, addPrompts } from '../../services/clientService';

function KeywordDiscovery({ clientId, clientIndustry, clientLocation, onPromptsAdded }) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [industry, setIndustry] = useState(clientIndustry || '');
  const [services, setServices] = useState('');
  const [location, setLocation] = useState(clientLocation || '');
  const [depth, setDepth] = useState('standard');
  const [engine, setEngine] = useState('chatgpt');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedPrompts, setSelectedPrompts] = useState(new Set());
  const [step, setStep] = useState('input'); // 'input' | 'scanning' | 'results' | 'adding'
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ percent: 0, message: '' });

  const handleDiscover = async () => {
    if (!industry.trim()) {
      setError('Industry is required');
      return;
    }

    setLoading(true);
    setStep('scanning');
    setError('');
    setProgress({ percent: 0, message: 'Starting discovery...' });

    try {
      const serviceList = services
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const result = await discoverKeywords(clientId, {
        industry: industry.trim(),
        services: serviceList,
        location: location.trim() || undefined,
        depth,
        engine,
      });

      setResults(result);

      // Pre-select all discovered prompts (featured + mentioned)
      const allDiscovered = [
        ...result.discovered.featured.map(d => d.prompt),
        ...result.discovered.mentioned.map(d => d.prompt),
      ];
      setSelectedPrompts(new Set(allDiscovered));

      setStep('results');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Discovery failed');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const togglePrompt = (prompt) => {
    const newSelected = new Set(selectedPrompts);
    if (newSelected.has(prompt)) {
      newSelected.delete(prompt);
    } else {
      newSelected.add(prompt);
    }
    setSelectedPrompts(newSelected);
  };

  const selectAll = () => {
    if (!results) return;
    const allDiscovered = [
      ...results.discovered.featured.map(d => d.prompt),
      ...results.discovered.mentioned.map(d => d.prompt),
    ];
    setSelectedPrompts(new Set(allDiscovered));
  };

  const deselectAll = () => {
    setSelectedPrompts(new Set());
  };

  const handleAddSelected = async () => {
    if (selectedPrompts.size === 0) {
      setError('Please select at least one prompt to add');
      return;
    }

    setStep('adding');
    setError('');

    try {
      await addPrompts(clientId, Array.from(selectedPrompts));

      // Reset and close
      setIsOpen(false);
      setStep('input');
      setResults(null);
      setSelectedPrompts(new Set());

      if (onPromptsAdded) {
        onPromptsAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed to add prompts');
      setStep('results');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('input');
    setError('');
    setResults(null);
  };

  const handleBack = () => {
    setStep('input');
    setError('');
  };

  const getMentionBadge = (type) => {
    const styles = {
      FEATURED: { bg: theme.greenGlow, border: theme.greenBorder, color: theme.green },
      MENTIONED: { bg: theme.blueGlow, border: theme.blueBorder, color: theme.blue },
    };
    const style = styles[type] || styles.MENTIONED;

    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}>
        {type}
      </span>
    );
  };

  return (
    <>
      <Button
        size="small"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        style={{
          background: theme.greenGlow,
          borderColor: theme.greenBorder,
          color: theme.green,
        }}
      >
        Discover Keywords
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          step === 'input' ? 'Discover Keywords' :
          step === 'scanning' ? 'Discovering Keywords...' :
          'Discovery Results'
        }
        width={700}
        footer={
          step === 'input' ? (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleDiscover} loading={loading}>
                Start Discovery
              </Button>
            </>
          ) : step === 'results' ? (
            <>
              <Button onClick={handleBack}>New Discovery</Button>
              <Button
                variant="primary"
                onClick={handleAddSelected}
                loading={step === 'adding'}
                disabled={selectedPrompts.size === 0}
              >
                Add {selectedPrompts.size} Prompt{selectedPrompts.size !== 1 ? 's' : ''} to Client
              </Button>
            </>
          ) : null
        }
      >
        {error && (
          <div style={{
            padding: '10px 14px',
            background: theme.redGlow,
            border: `1px solid ${theme.redBorder}`,
            borderRadius: 8,
            color: theme.red,
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {step === 'input' && (
          <>
            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 16 }}>
              Discover what search prompts your brand already appears in across AI platforms.
              This helps identify keywords you're ranking for without manual guessing.
            </p>

            <Input
              label="Industry / Niche *"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., solar installation, digital marketing, dental services"
              fullWidth
              helperText="The industry your business operates in"
            />

            <Input
              label="Primary Services (Optional)"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="e.g., residential solar, commercial solar, solar financing"
              fullWidth
              multiline
              rows={2}
              helperText="Separate multiple services with commas"
            />

            <Input
              label="Target Location (Optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Los Angeles, California"
              fullWidth
            />

            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.text,
                }}>
                  Discovery Depth
                </label>
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: theme.bgElevated,
                    color: theme.text,
                    fontSize: 14,
                  }}
                >
                  <option value="quick">Quick (10 prompts)</option>
                  <option value="standard">Standard (25 prompts)</option>
                  <option value="thorough">Thorough (50 prompts)</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.text,
                }}>
                  AI Engine
                </label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: theme.bgElevated,
                    color: theme.text,
                    fontSize: 14,
                  }}
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="perplexity">Perplexity</option>
                  <option value="google">Google AI Overview</option>
                </select>
              </div>
            </div>

            <div style={{
              marginTop: 20,
              padding: 16,
              background: theme.bg,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                How it works:
              </div>
              <ol style={{
                margin: 0,
                padding: '0 0 0 20px',
                fontSize: 13,
                color: theme.textDim,
              }}>
                <li>AI generates discovery prompts for your industry</li>
                <li>We scan each prompt to check if your brand appears</li>
                <li>You see which prompts return your brand as Featured or Mentioned</li>
                <li>Add successful prompts to track regularly</li>
              </ol>
            </div>
          </>
        )}

        {step === 'scanning' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
          }}>
            <LoadingSpinner size={48} />
            <p style={{ marginTop: 24, color: theme.text, fontSize: 16 }}>
              Discovering keywords...
            </p>
            <p style={{ marginTop: 8, color: theme.textMuted, fontSize: 13 }}>
              This may take a few minutes depending on the depth selected.
            </p>
            <div style={{
              marginTop: 24,
              width: '100%',
              maxWidth: 300,
              height: 6,
              background: theme.bg,
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                background: theme.blue,
                borderRadius: 3,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            </div>
          </div>
        )}

        {step === 'results' && results && (
          <>
            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{
                padding: 16,
                background: theme.bg,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: theme.text }}>
                  {results.summary.totalScanned}
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  Prompts Scanned
                </div>
              </div>
              <div style={{
                padding: 16,
                background: theme.greenGlow,
                border: `1px solid ${theme.greenBorder}`,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: theme.green }}>
                  {results.summary.featuredCount}
                </div>
                <div style={{ fontSize: 11, color: theme.green, marginTop: 4 }}>
                  Featured
                </div>
              </div>
              <div style={{
                padding: 16,
                background: theme.blueGlow,
                border: `1px solid ${theme.blueBorder}`,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: theme.blue }}>
                  {results.summary.mentionedCount}
                </div>
                <div style={{ fontSize: 11, color: theme.blue, marginTop: 4 }}>
                  Mentioned
                </div>
              </div>
              <div style={{
                padding: 16,
                background: theme.bg,
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: theme.text }}>
                  {results.summary.visibilityRate}
                </div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                  Visibility Rate
                </div>
              </div>
            </div>

            {/* Discovered Prompts */}
            {(results.discovered.featured.length > 0 || results.discovered.mentioned.length > 0) ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <p style={{ color: theme.text, fontSize: 14, fontWeight: 500, margin: 0 }}>
                    Discovered Keywords ({results.discovered.featured.length + results.discovered.mentioned.length})
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={selectAll}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: theme.blue,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: theme.textMuted,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div style={{
                  maxHeight: 350,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {/* Featured prompts first */}
                  {results.discovered.featured.map((item, index) => (
                    <label
                      key={`featured-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 14px',
                        background: selectedPrompts.has(item.prompt) ? theme.greenGlow : theme.bg,
                        border: `1px solid ${selectedPrompts.has(item.prompt) ? theme.greenBorder : theme.border}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrompts.has(item.prompt)}
                        onChange={() => togglePrompt(item.prompt)}
                        style={{
                          marginTop: 2,
                          width: 16,
                          height: 16,
                          accentColor: theme.green,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                        }}>
                          {getMentionBadge('FEATURED')}
                          <span style={{ fontSize: 11, color: theme.textMuted }}>
                            {item.engine}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, color: theme.text, lineHeight: 1.4 }}>
                          "{item.prompt}"
                        </span>
                      </div>
                    </label>
                  ))}

                  {/* Mentioned prompts */}
                  {results.discovered.mentioned.map((item, index) => (
                    <label
                      key={`mentioned-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 14px',
                        background: selectedPrompts.has(item.prompt) ? theme.blueGlow : theme.bg,
                        border: `1px solid ${selectedPrompts.has(item.prompt) ? theme.blueBorder : theme.border}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrompts.has(item.prompt)}
                        onChange={() => togglePrompt(item.prompt)}
                        style={{
                          marginTop: 2,
                          width: 16,
                          height: 16,
                          accentColor: theme.blue,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                        }}>
                          {getMentionBadge('MENTIONED')}
                          <span style={{ fontSize: 11, color: theme.textMuted }}>
                            {item.engine}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, color: theme.text, lineHeight: 1.4 }}>
                          "{item.prompt}"
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  background: theme.bg,
                  borderRadius: 8,
                  fontSize: 12,
                  color: theme.textMuted,
                }}>
                  {selectedPrompts.size} of {results.discovered.featured.length + results.discovered.mentioned.length} discovered prompts selected
                </div>
              </>
            ) : (
              <div style={{
                padding: 40,
                textAlign: 'center',
                background: theme.bg,
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <p style={{ color: theme.text, fontSize: 16, marginBottom: 8 }}>
                  No Rankings Found
                </p>
                <p style={{ color: theme.textMuted, fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
                  Your brand wasn't found in the discovery prompts. Try:
                </p>
                <ul style={{
                  textAlign: 'left',
                  maxWidth: 300,
                  margin: '16px auto 0',
                  fontSize: 13,
                  color: theme.textDim,
                }}>
                  <li>Adding more specific services</li>
                  <li>Trying a different AI engine</li>
                  <li>Using a more thorough discovery depth</li>
                  <li>Adjusting your industry description</li>
                </ul>
              </div>
            )}
          </>
        )}

        {step === 'adding' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}>
            <LoadingSpinner size={32} />
            <p style={{ marginTop: 16, color: theme.textMuted }}>
              Adding {selectedPrompts.size} prompts to client...
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

export default KeywordDiscovery;
