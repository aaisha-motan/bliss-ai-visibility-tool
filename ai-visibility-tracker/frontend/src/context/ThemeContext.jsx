import { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved && themes[saved]) {
      return saved;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  const theme = themes[themeName];

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', themeName);
    // Update document attribute for CSS variables
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  const toggleTheme = () => {
    setThemeName(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (name) => {
    if (themes[name]) {
      setThemeName(name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
