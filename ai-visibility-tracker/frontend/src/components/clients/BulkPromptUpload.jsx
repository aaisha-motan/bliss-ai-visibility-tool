import { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { bulkUploadPrompts, validateBulkCSV } from '../../services/clientService';

/**
 * BulkPromptUpload Component
 * Allows users to upload multiple prompts via CSV file
 * Rich's request: "Upload 100 prompts"
 * Created: February 17, 2026
 */
export default function BulkPromptUpload({ clientId, onPromptsAdded }) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('upload');
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      setCsvContent(content);
      setError(null);

      try {
        const validation = await validateBulkCSV(clientId, content);
        setPreview(validation);
        setStep('preview');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to validate CSV');
      }
    };
    reader.readAsText(file);
  };

  const handlePaste = async (e) => {
    const content = e.target.value;
    setCsvContent(content);
    if (content.trim()) {
      try {
        const validation = await validateBulkCSV(clientId, content);
        setPreview(validation);
      } catch (err) {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    setStep('uploading');
    setLoading(true);
    setError(null);

    try {
      const uploadResult = await bulkUploadPrompts(clientId, csvContent, skipDuplicates);
      setResult(uploadResult);
      setStep('done');
      if (uploadResult.added > 0 && onPromptsAdded) {
        onPromptsAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('upload');
    setCsvContent('');
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setStep('upload');
  };

  return (
    <>
      <Button variant="outline" size="small" onClick={handleOpen}>
        Bulk Upload
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Upload Prompts">
        {error && (
          <div style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            color: '#f87171',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: theme.textMuted }}>
              Upload a CSV file or paste prompts directly. Each line should contain one prompt.
            </p>

            <div style={{
              border: `2px dashed ${theme.border}`,
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
            }}>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Select CSV File
              </Button>
              <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                or drag and drop
              </p>
            </div>

            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                borderTop: `1px solid ${theme.border}`,
              }} />
              <span style={{
                position: 'relative',
                backgroundColor: theme.cardBg,
                padding: '0 12px',
                fontSize: 12,
                color: theme.textMuted,
              }}>
                Or paste prompts
              </span>
            </div>

            <textarea
              style={{
                width: '100%',
                height: 160,
                padding: 12,
                backgroundColor: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.text,
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder={`prompt,category\nBest marketing agencies?,discovery\nTop SEO companies,comparison`}
              value={csvContent}
              onChange={handlePaste}
            />

            {preview && (
              <div style={{ fontSize: 14, color: theme.primary }}>
                Found {preview.promptCount} valid prompts
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!csvContent.trim() || !preview?.valid}
              >
                Preview
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              backgroundColor: theme.inputBg,
              borderRadius: 8,
              padding: 16,
            }}>
              <h3 style={{ fontWeight: 500, color: theme.text, marginBottom: 8 }}>
                Preview ({preview.promptCount} prompts)
              </h3>
              <ul style={{ maxHeight: 192, overflowY: 'auto' }}>
                {preview.preview?.map((prompt, i) => (
                  <li key={i} style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    padding: '4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {i + 1}. {prompt}
                  </li>
                ))}
                {preview.promptCount > 5 && (
                  <li style={{ fontSize: 13, color: theme.textMuted, fontStyle: 'italic' }}>
                    ...and {preview.promptCount - 5} more
                  </li>
                )}
              </ul>
            </div>

            {preview.errors?.length > 0 && (
              <div style={{
                padding: 12,
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: 8,
                color: '#fbbf24',
                fontSize: 14,
              }}>
                {preview.errors.length} lines with errors (will be skipped)
              </div>
            )}

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: theme.textMuted,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Skip duplicate prompts
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleUpload}>
                Upload {preview.promptCount} Prompts
              </Button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 40,
              height: 40,
              border: '4px solid',
              borderColor: `${theme.primary} transparent transparent transparent`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: theme.textMuted }}>Uploading prompts...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: theme.text }}>Upload Complete!</h3>
            </div>

            <div style={{
              backgroundColor: theme.inputBg,
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: theme.textMuted }}>Prompts added:</span>
                <span style={{ color: '#22c55e', fontWeight: 500 }}>{result.added}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: theme.textMuted }}>Duplicates skipped:</span>
                <span style={{ color: '#eab308' }}>{result.duplicates}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: theme.textMuted }}>Total processed:</span>
                <span style={{ color: theme.text }}>{result.total}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
