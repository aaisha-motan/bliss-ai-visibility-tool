import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { getTokenStatus } from '../../services/settingsService';

/**
 * TokenStatusBanner Component
 * Displays a warning banner when session tokens are expired or invalid
 * Shows at the top of the page to notify users to update their tokens
 *
 * Created: February 18, 2026
 * Purpose: Notify users when their session tokens expire
 */
export default function TokenStatusBanner() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTokenStatus();
    // Check every 5 minutes
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkTokenStatus = async () => {
    try {
      const result = await getTokenStatus();
      if (result.hasIssues) {
        setIssues(result.needsAttention);
        setDismissed(false);
      } else {
        setIssues([]);
      }
    } catch (error) {
      // Silently fail - don't show banner if we can't check
      console.error('Failed to check token status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show anything while loading or if dismissed
  if (loading || dismissed || issues.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: 'rgba(234, 179, 8, 0.15)',
      borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <span style={{ color: '#eab308', fontWeight: 500, fontSize: 14 }}>
            Session Token{issues.length > 1 ? 's' : ''} Expired
          </span>
          <span style={{ color: theme.textMuted, fontSize: 14, marginLeft: 8 }}>
            {issues.map(i => i.engine).join(' and ')} session token{issues.length > 1 ? 's need' : ' needs'} to be updated
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleGoToSettings}
          style={{
            padding: '6px 12px',
            backgroundColor: '#eab308',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Update Tokens
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: theme.textMuted,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
