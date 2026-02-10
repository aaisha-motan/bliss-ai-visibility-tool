import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

function Login() {
  const { theme } = useTheme();
  const { login, register, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    if (isRegister) {
      await register(formData.email, formData.password, formData.name);
    } else {
      await login(formData.email, formData.password);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleMode = () => {
    setIsRegister(prev => !prev);
    clearError();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.bg,
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${theme.blue}, ${theme.orange})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: 'white',
              fontWeight: 700,
            }}>
              AI
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 22,
                fontWeight: 700,
                color: theme.text,
              }}>
                AI Visibility Tracker
              </div>
              <div style={{
                fontSize: 13,
                color: theme.textMuted,
              }}>
                by Bliss Drive
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 32,
        }}>
          <h1 style={{
            margin: '0 0 24px',
            fontSize: 20,
            fontWeight: 600,
            color: theme.text,
            textAlign: 'center',
          }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>

          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: 20,
              borderRadius: 8,
              background: theme.redBg,
              color: theme.red,
              fontSize: 13,
              border: `1px solid rgba(248, 81, 73, 0.2)`,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                fullWidth
              />
            )}

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              fullWidth
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              fullWidth
              helperText={isRegister ? 'At least 8 characters' : undefined}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              style={{ marginTop: 8 }}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 13,
            color: theme.textMuted,
          }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: theme.blue,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {isRegister ? 'Sign In' : 'Create one'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 12,
          color: theme.textDim,
        }}>
          Powered by{' '}
          <a
            href="https://blissdrive.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.orange }}
          >
            Bliss Drive
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
