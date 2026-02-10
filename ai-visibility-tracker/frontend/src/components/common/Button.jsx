import { useTheme } from '../../context/ThemeContext';

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'default', // 'default', 'primary', 'orange', 'danger', 'ghost'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  fullWidth = false,
  style = {},
  ...props
}) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${theme.blue}, #0052CC)`,
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0, 102, 255, 0.25)',
        };
      case 'orange':
        return {
          background: `linear-gradient(135deg, ${theme.orange}, #E08600)`,
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 16px rgba(255, 149, 0, 0.2)',
        };
      case 'danger':
        return {
          background: theme.redBg,
          color: theme.red,
          border: `1px solid rgba(248, 81, 73, 0.3)`,
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: theme.textMuted,
          border: `1px solid ${theme.border}`,
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: theme.text,
          border: `1px solid ${theme.border}`,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '6px 14px', fontSize: 12 };
      case 'large':
        return { padding: '14px 28px', fontSize: 15 };
      default:
        return { padding: '10px 24px', fontSize: 13 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variantStyles,
        ...sizeStyles,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 10,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
}

export default Button;
