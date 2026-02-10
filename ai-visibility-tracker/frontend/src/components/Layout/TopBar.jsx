import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/scan': 'Run Scan',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

function TopBar() {
  const { theme } = useTheme();
  const location = useLocation();

  // Get page title based on current path
  const getTitle = () => {
    // Exact match
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }

    // Check for dynamic routes
    if (location.pathname.startsWith('/clients/')) {
      return 'Client Details';
    }
    if (location.pathname.startsWith('/reports/')) {
      return 'Report Details';
    }
    if (location.pathname.startsWith('/scan/')) {
      return 'Run Scan';
    }

    return 'AI Visibility Tracker';
  };

  return (
    <header style={{
      height: 64,
      padding: '0 32px',
      background: theme.bgCard,
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <h1 style={{
        fontSize: 20,
        fontWeight: 600,
        color: theme.text,
        margin: 0,
      }}>
        {getTitle()}
      </h1>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Current Date */}
        <div style={{
          fontSize: 13,
          color: theme.textMuted,
        }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
