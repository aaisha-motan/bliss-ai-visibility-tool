import { useTheme } from '../../context/ThemeContext';

function LoadingSpinner({ size = 24, color, style = {} }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${theme.border}`,
        borderTopColor: color || theme.blue,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        ...style,
      }}
    />
  );
}

export default LoadingSpinner;
