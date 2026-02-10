import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◐' },
  { path: '/clients', label: 'Clients', icon: '◑' },
  { path: '/scan', label: 'Run Scan', icon: '◒' },
  { path: '/reports', label: 'Reports', icon: '◓' },
  { path: '/settings', label: 'Settings', icon: '◔' },
];

function Sidebar() {
  const { theme, themeName, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const linkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 10,
    color: isActive ? theme.text : theme.textMuted,
    background: isActive ? theme.blueGlow : 'transparent',
    border: isActive ? `1px solid ${theme.blueBorder}` : '1px solid transparent',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s',
  });

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: 260,
      background: theme.bgCard,
      borderRight: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
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
          <div>
            <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>
              AI Visibility
            </div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>
              Tracker Pro
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => linkStyle(isActive)}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.border}`,
      }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.bg,
            color: theme.textMuted,
            cursor: 'pointer',
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          <span>{themeName === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          <span style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: themeName === 'dark' ? theme.blue : theme.border,
            position: 'relative',
            transition: 'background 0.2s',
          }}>
            <span style={{
              position: 'absolute',
              top: 2,
              left: themeName === 'dark' ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s',
            }} />
          </span>
        </button>

        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 0',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: theme.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: 11,
              color: theme.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.email || ''}
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              padding: 6,
              border: 'none',
              background: 'transparent',
              color: theme.textMuted,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⏻
          </button>
        </div>

        {/* Bliss Drive Branding */}
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${theme.border}`,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 10,
            color: theme.textDim,
            letterSpacing: '0.05em',
          }}>
            POWERED BY
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.orange,
            marginTop: 2,
          }}>
            Bliss Drive
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
