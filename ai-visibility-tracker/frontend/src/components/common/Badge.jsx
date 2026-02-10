import { useTheme } from '../../context/ThemeContext';
import { getMentionColor, getMentionBg } from '../../theme';

function Badge({
  children,
  variant = 'default', // 'default', 'success', 'warning', 'error', 'info'
  mentionType, // 'FEATURED', 'MENTIONED', 'COMPETITOR_ONLY', 'NOT_FOUND'
  size = 'medium', // 'small', 'medium'
  style = {},
}) {
  const { theme } = useTheme();

  const getColors = () => {
    // If mentionType is provided, use those colors
    if (mentionType) {
      return {
        color: getMentionColor(mentionType, theme),
        background: getMentionBg(mentionType, theme),
      };
    }

    // Otherwise use variant
    switch (variant) {
      case 'success':
        return { color: theme.green, background: theme.greenBg };
      case 'warning':
        return { color: theme.yellow, background: theme.yellowBg };
      case 'error':
        return { color: theme.red, background: theme.redBg };
      case 'info':
        return { color: theme.blue, background: theme.blueGlow };
      default:
        return { color: theme.textMuted, background: theme.grayBg };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'small' ? '2px 8px' : '4px 12px',
        borderRadius: 6,
        fontSize: size === 'small' ? 10 : 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...colors,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
