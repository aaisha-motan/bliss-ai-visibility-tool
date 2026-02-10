import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getSettings, updateSettings } from '../services/authService';
import connectService from '../services/connectService';

function Settings() {
  const { theme, themeName, setTheme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState({
    hasSerpApiKey: false,
    hasChatgptSession: false,
    hasPerplexitySession: false,
  });
  const [formData, setFormData] = useState({
    serpApiKey: '',
    chatgptSessionToken: '',
    perplexitySessionToken: '',
  });

  // Connect Account states
  const [connectionStatus, setConnectionStatus] = useState({
    chatgpt: { connected: false, loading: false, loginInProgress: false },
    perplexity: { connected: false, loading: false, loginInProgress: false },
    google: { connected: false },
  });
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const statusPollRef = useRef(null);

  useEffect(() => {
    loadSettings();
    loadConnectionStatus();
    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionStatus = async () => {
    try {
      const status = await connectService.getConnectionStatus();
      setConnectionStatus(prev => ({
        ...prev,
        chatgpt: { ...prev.chatgpt, connected: status.chatgpt?.connected || false },
        perplexity: { ...prev.perplexity, connected: status.perplexity?.connected || false },
        google: { connected: status.google?.connected || false },
      }));
    } catch (error) {
      console.error('Failed to load connection status:', error);
    }
  };

  const handleSave = async (field) => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettings({ [field]: formData[field] });
      setSettings(prev => ({
        ...prev,
        [`has${field.charAt(0).toUpperCase() + field.slice(1).replace('SessionToken', 'Session').replace('ApiKey', 'ApiKey')}`]: !!formData[field],
      }));
      setFormData(prev => ({ ...prev, [field]: '' }));
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      await loadSettings();
      await loadConnectionStatus();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await updateSettings({ theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Connect Account handlers
  const startConnection = async (platform) => {
    setConnectingPlatform(platform);
    setConnectionStatus(prev => ({
      ...prev,
      [platform]: { ...prev[platform], loading: true },
    }));
    setMessage(null);

    try {
      const result = await connectService.startLogin(platform);

      if (result.success) {
        setConnectionStatus(prev => ({
          ...prev,
          [platform]: { ...prev[platform], loading: false, loginInProgress: true },
        }));
        setMessage({
          type: 'info',
          text: `A browser window has opened. Please log into your ${platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity'} account. Once logged in, click "Complete Connection" below.`
        });

        // Start polling for login status
        statusPollRef.current = setInterval(async () => {
          try {
            const status = await connectService.checkLoginStatus(platform);
            if (status.loggedIn) {
              // User appears to be logged in
              setMessage({
                type: 'success',
                text: `Login detected! Click "Complete Connection" to save your session.`
              });
            }
          } catch (err) {
            console.error('Status check error:', err);
          }
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to start login');
      }
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [platform]: { ...prev[platform], loading: false, loginInProgress: false },
      }));
      setMessage({ type: 'error', text: error.message || 'Failed to start connection' });
      setConnectingPlatform(null);
    }
  };

  const completeConnection = async (platform) => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }

    setConnectionStatus(prev => ({
      ...prev,
      [platform]: { ...prev[platform], loading: true },
    }));

    try {
      const result = await connectService.completeLogin(platform);

      if (result.success) {
        setConnectionStatus(prev => ({
          ...prev,
          [platform]: { connected: true, loading: false, loginInProgress: false },
        }));
        setMessage({ type: 'success', text: `${platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity'} account connected successfully!` });
        await loadSettings();
      } else {
        throw new Error(result.error || 'Failed to complete connection');
      }
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [platform]: { ...prev[platform], loading: false },
      }));
      setMessage({ type: 'error', text: error.message || 'Failed to complete connection. Make sure you are logged in.' });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const cancelConnection = async (platform) => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }

    try {
      await connectService.cancelLogin(platform);
    } catch (error) {
      console.error('Cancel error:', error);
    }

    setConnectionStatus(prev => ({
      ...prev,
      [platform]: { ...prev[platform], loading: false, loginInProgress: false },
    }));
    setConnectingPlatform(null);
    setMessage(null);
  };

  const disconnectPlatform = async (platform) => {
    setConnectionStatus(prev => ({
      ...prev,
      [platform]: { ...prev[platform], loading: true },
    }));

    try {
      await connectService.disconnect(platform);
      setConnectionStatus(prev => ({
        ...prev,
        [platform]: { connected: false, loading: false, loginInProgress: false },
      }));
      setMessage({ type: 'success', text: `${platform === 'chatgpt' ? 'ChatGPT' : 'Perplexity'} account disconnected.` });
      await loadSettings();
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [platform]: { ...prev[platform], loading: false },
      }));
      setMessage({ type: 'error', text: 'Failed to disconnect' });
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

  const renderPlatformCard = (platform, name, icon, description) => {
    const status = connectionStatus[platform];
    const isConnecting = connectingPlatform === platform;

    return (
      <div style={{
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${status.connected ? theme.greenBorder : theme.border}`,
        background: status.connected ? theme.greenBg : 'transparent',
        marginBottom: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: status.loginInProgress ? 16 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: theme.cardBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>{name}</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>{description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {status.connected ? (
              <>
                <div style={{
                  padding: '4px 12px',
                  background: theme.greenBg,
                  borderRadius: 4,
                  color: theme.green,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${theme.greenBorder}`,
                }}>
                  Connected
                </div>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => disconnectPlatform(platform)}
                  loading={status.loading}
                >
                  Disconnect
                </Button>
              </>
            ) : status.loginInProgress ? (
              <div style={{
                padding: '4px 12px',
                background: theme.yellowBg,
                borderRadius: 4,
                color: theme.yellow,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${theme.yellowBorder}`,
              }}>
                Login in Progress...
              </div>
            ) : (
              <Button
                onClick={() => startConnection(platform)}
                loading={status.loading}
                disabled={connectingPlatform && connectingPlatform !== platform}
              >
                Connect Account
              </Button>
            )}
          </div>
        </div>

        {status.loginInProgress && (
          <div style={{
            padding: 16,
            background: theme.bgSecondary,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              color: theme.yellow,
              fontSize: 13,
            }}>
              <LoadingSpinner size={16} />
              <span>Waiting for login...</span>
            </div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16 }}>
              A browser window should have opened. Log into your {name} account there, then click the button below.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                onClick={() => completeConnection(platform)}
                loading={status.loading}
              >
                Complete Connection
              </Button>
              <Button
                variant="outline"
                onClick={() => cancelConnection(platform)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 24,
          borderRadius: 8,
          background: message.type === 'success' ? theme.greenBg :
                      message.type === 'info' ? theme.blueGlow : theme.redBg,
          color: message.type === 'success' ? theme.green :
                 message.type === 'info' ? theme.blue : theme.red,
          fontSize: 13,
          border: `1px solid ${message.type === 'success' ? theme.greenBorder :
                              message.type === 'info' ? theme.blueBorder : theme.redBorder}`,
        }}>
          {message.text}
        </div>
      )}

      {/* User Profile */}
      <Card title="Profile" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: theme.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24,
            fontWeight: 700,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: theme.text }}>
              {user?.name}
            </div>
            <div style={{ color: theme.textMuted }}>
              {user?.email}
            </div>
            <div style={{
              marginTop: 4,
              fontSize: 12,
              padding: '2px 8px',
              background: theme.blueGlow,
              border: `1px solid ${theme.blueBorder}`,
              borderRadius: 4,
              color: theme.blue,
              display: 'inline-block',
            }}>
              {user?.role}
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card title="Appearance" style={{ marginBottom: 24 }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: 12,
            fontSize: 13,
            fontWeight: 500,
            color: theme.text,
          }}>
            Theme
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => handleThemeChange('dark')}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${themeName === 'dark' ? theme.blue : theme.border}`,
                background: themeName === 'dark' ? theme.blueGlow : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🌙</div>
              <div style={{ fontWeight: 600, color: theme.text }}>Dark</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                Easy on the eyes
              </div>
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${themeName === 'light' ? theme.blue : theme.border}`,
                background: themeName === 'light' ? theme.blueGlow : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>☀️</div>
              <div style={{ fontWeight: 600, color: theme.text }}>Light</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                Classic look
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Connect Accounts - New Section */}
      <Card
        title="Connect Accounts"
        subtitle="Connect your AI platform accounts for real-time scanning"
        style={{ marginBottom: 24 }}
      >
        <div style={{
          padding: 12,
          background: theme.bgSecondary,
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 13,
          color: theme.textMuted,
          border: `1px solid ${theme.border}`,
        }}>
          <strong style={{ color: theme.text }}>How it works:</strong> Click "Connect Account" to open a browser window.
          Log into your account there, then click "Complete Connection" to save your session.
          This allows us to scan AI platforms as if you were browsing them yourself.
        </div>

        {renderPlatformCard(
          'chatgpt',
          'ChatGPT',
          '🤖',
          'Connect your OpenAI account for ChatGPT scanning'
        )}

        {renderPlatformCard(
          'perplexity',
          'Perplexity',
          '🔮',
          'Connect your Perplexity account for AI search scanning'
        )}

        {/* Google - SERP API based */}
        <div style={{
          padding: 20,
          borderRadius: 12,
          border: `1px solid ${settings.hasSerpApiKey ? theme.greenBorder : theme.border}`,
          background: settings.hasSerpApiKey ? theme.greenBg : 'transparent',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: theme.cardBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                🔍
              </div>
              <div>
                <div style={{ fontWeight: 600, color: theme.text }}>Google AI Overview</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>Uses SERP API - configure below</div>
              </div>
            </div>
            {settings.hasSerpApiKey ? (
              <div style={{
                padding: '4px 12px',
                background: theme.greenBg,
                borderRadius: 4,
                color: theme.green,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${theme.greenBorder}`,
              }}>
                API Key Configured
              </div>
            ) : (
              <div style={{
                padding: '4px 12px',
                background: theme.yellowBg,
                borderRadius: 4,
                color: theme.yellow,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${theme.yellowBorder}`,
              }}>
                Not Configured
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* API Keys - Manual Configuration */}
      <Card title="Manual API Configuration" subtitle="Or configure tokens manually if automatic connection doesn't work">
        {/* SERP API */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>SERP API Key</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                Required for Google AI Overview scanning
              </div>
            </div>
            {settings.hasSerpApiKey && (
              <div style={{
                padding: '4px 12px',
                background: theme.greenBg,
                borderRadius: 4,
                color: theme.green,
                fontSize: 12,
                fontWeight: 600,
              }}>
                Configured
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input
              type="password"
              placeholder={settings.hasSerpApiKey ? '••••••••••••••••' : 'Enter your SERP API key'}
              value={formData.serpApiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, serpApiKey: e.target.value }))}
              fullWidth
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <Button
              onClick={() => handleSave('serpApiKey')}
              loading={saving}
              disabled={!formData.serpApiKey}
            >
              {settings.hasSerpApiKey ? 'Update' : 'Save'}
            </Button>
          </div>
          <a
            href="https://serpapi.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: theme.blue }}
          >
            Get a SERP API key →
          </a>
        </div>

        {/* ChatGPT Session - Manual */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>ChatGPT Session Token (Manual)</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                Alternative to automatic connection
              </div>
            </div>
            {settings.hasChatgptSession && (
              <div style={{
                padding: '4px 12px',
                background: theme.greenBg,
                borderRadius: 4,
                color: theme.green,
                fontSize: 12,
                fontWeight: 600,
              }}>
                Configured
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input
              type="password"
              placeholder={settings.hasChatgptSession ? '••••••••••••••••' : 'Enter session token'}
              value={formData.chatgptSessionToken}
              onChange={(e) => setFormData(prev => ({ ...prev, chatgptSessionToken: e.target.value }))}
              fullWidth
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <Button
              onClick={() => handleSave('chatgptSessionToken')}
              loading={saving}
              disabled={!formData.chatgptSessionToken}
            >
              {settings.hasChatgptSession ? 'Update' : 'Save'}
            </Button>
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
            Find this in browser DevTools → Application → Cookies → __Secure-next-auth.session-token
          </div>
        </div>

        {/* Perplexity Session - Manual */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>Perplexity Session Token (Manual)</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                Alternative to automatic connection
              </div>
            </div>
            {settings.hasPerplexitySession && (
              <div style={{
                padding: '4px 12px',
                background: theme.greenBg,
                borderRadius: 4,
                color: theme.green,
                fontSize: 12,
                fontWeight: 600,
              }}>
                Configured
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input
              type="password"
              placeholder={settings.hasPerplexitySession ? '••••••••••••••••' : 'Enter session token'}
              value={formData.perplexitySessionToken}
              onChange={(e) => setFormData(prev => ({ ...prev, perplexitySessionToken: e.target.value }))}
              fullWidth
              containerStyle={{ flex: 1, marginBottom: 0 }}
            />
            <Button
              onClick={() => handleSave('perplexitySessionToken')}
              loading={saving}
              disabled={!formData.perplexitySessionToken}
            >
              {settings.hasPerplexitySession ? 'Update' : 'Save'}
            </Button>
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
            Find this in browser DevTools → Application → Cookies → pplx_session
          </div>
        </div>
      </Card>

      {/* About */}
      <Card title="About" style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            margin: '0 auto 16px',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${theme.blue}, ${theme.orange})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'white',
            fontWeight: 700,
          }}>
            AI
          </div>
          <div style={{ fontWeight: 700, color: theme.text, fontSize: 16 }}>
            AI Visibility Tracker Pro
          </div>
          <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
            Version 1.0.0
          </div>
          <div style={{ marginTop: 16 }}>
            <a
              href="https://blissdrive.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.orange,
                fontWeight: 600,
              }}
            >
              Powered by Bliss Drive
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Settings;
