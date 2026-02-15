/**
 * Prompt Generator Component
 * Generates AI search prompts from keywords
 *
 * NEW FILE - Added February 12, 2026
 * Purpose: Address Rich's request for auto-generating prompts from keywords
 */

import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { generatePrompts, addPrompts } from '../../services/clientService';

function PromptGenerator({ clientId, clientLocation, onPromptsAdded }) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState(clientLocation || '');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [selectedPrompts, setSelectedPrompts] = useState(new Set());
  const [step, setStep] = useState('input'); // 'input' | 'review' | 'adding'
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('Please enter at least one keyword');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Split keywords by comma or newline
      const keywordList = keywords
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const result = await generatePrompts(clientId, {
        keywords: keywordList,
        location: location.trim() || undefined,
        count: parseInt(count, 10),
      });

      setGeneratedPrompts(result.prompts);
      setSelectedPrompts(new Set(result.prompts)); // Select all by default
      setStep('review');
    } catch (err) {
      setError(err.message || 'Failed to generate prompts');
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
    setSelectedPrompts(new Set(generatedPrompts));
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
      setKeywords('');
      setGeneratedPrompts([]);
      setSelectedPrompts(new Set());

      // Notify parent to refresh
      if (onPromptsAdded) {
        onPromptsAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed to add prompts');
      setStep('review');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('input');
    setError('');
  };

  const handleBack = () => {
    setStep('input');
    setError('');
  };

  return (
    <>
      <Button
        size="small"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        style={{
          background: theme.purpleGlow,
          borderColor: theme.purpleBorder,
          color: theme.purple,
        }}
      >
        Generate from Keywords
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={step === 'input' ? 'Generate Prompts from Keywords' : 'Review Generated Prompts'}
        width={600}
        footer={
          step === 'input' ? (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerate} loading={loading}>
                Generate Prompts
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleBack}>Back</Button>
              <Button
                variant="primary"
                onClick={handleAddSelected}
                loading={step === 'adding'}
                disabled={selectedPrompts.size === 0}
              >
                Add {selectedPrompts.size} Prompt{selectedPrompts.size !== 1 ? 's' : ''}
              </Button>
            </>
          )
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
              Enter your focus keywords and the AI will generate relevant search prompts
              that users might ask about your services.
            </p>

            <Input
              label="Keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas (e.g., solar panels, residential solar, home solar installation)"
              fullWidth
              multiline
              rows={3}
              helperText="Separate multiple keywords with commas or new lines"
            />

            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Input
                label="Location (Optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Los Angeles, CA"
                containerStyle={{ flex: 1, marginBottom: 0 }}
              />
              <Input
                label="Number of Prompts"
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min={5}
                max={50}
                containerStyle={{ width: 140, marginBottom: 0 }}
              />
            </div>

            <div style={{
              marginTop: 20,
              padding: 16,
              background: theme.bg,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                Example prompts that might be generated:
              </div>
              <ul style={{
                margin: 0,
                padding: '0 0 0 20px',
                fontSize: 13,
                color: theme.textDim,
              }}>
                <li>"Best [keyword] services in [location]"</li>
                <li>"Who should I hire for [keyword]"</li>
                <li>"Top rated [keyword] companies near me"</li>
                <li>"How to find a good [keyword] provider"</li>
              </ul>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <p style={{ color: theme.textMuted, fontSize: 13, margin: 0 }}>
                Select the prompts you want to add to this client:
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
              maxHeight: 400,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {generatedPrompts.map((prompt, index) => (
                <label
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    background: selectedPrompts.has(prompt) ? theme.blueGlow : theme.bg,
                    border: `1px solid ${selectedPrompts.has(prompt) ? theme.blueBorder : theme.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPrompts.has(prompt)}
                    onChange={() => togglePrompt(prompt)}
                    style={{
                      marginTop: 2,
                      width: 16,
                      height: 16,
                      accentColor: theme.blue,
                    }}
                  />
                  <span style={{ fontSize: 13, color: theme.text, lineHeight: 1.4 }}>
                    "{prompt}"
                  </span>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>
                {selectedPrompts.size} of {generatedPrompts.length} prompts selected
              </span>
              <span style={{ color: theme.textDim }}>
                Generated via {generatedPrompts.source === 'openai' ? 'AI' : 'templates'}
              </span>
            </div>
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
              Adding {selectedPrompts.size} prompts...
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

export default PromptGenerator;
