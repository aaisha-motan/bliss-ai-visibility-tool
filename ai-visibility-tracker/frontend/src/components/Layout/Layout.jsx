import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TokenStatusBanner from '../common/TokenStatusBanner';
import { useTheme } from '../../context/ThemeContext';

function Layout() {
  const { theme } = useTheme();

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: theme.bg,
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 260,
        minHeight: '100vh',
      }}>
        <TopBar />
        <TokenStatusBanner />
        <main style={{
          flex: 1,
          padding: '24px 32px',
          overflowY: 'auto',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
