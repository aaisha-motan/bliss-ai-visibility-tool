import { useTheme } from '../../context/ThemeContext';

function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  multiline = false,
  rows = 3,
  style = {},
  containerStyle = {},
  ...props
}) {
  const { theme } = useTheme();

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: '12px 16px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: theme.text,
    background: theme.bgInput,
    border: `1px solid ${error ? theme.red : theme.border}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'all 0.2s',
    resize: multiline ? 'vertical' : 'none',
    ...style,
  };

  return (
    <div style={{
      marginBottom: 16,
      width: fullWidth ? '100%' : 'auto',
      ...containerStyle,
    }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 500,
          color: theme.text,
        }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          rows={rows}
          style={inputStyles}
          {...props}
        />
      ) : (
        <input
          style={inputStyles}
          {...props}
        />
      )}
      {(error || helperText) && (
        <p style={{
          marginTop: 6,
          fontSize: 12,
          color: error ? theme.red : theme.textMuted,
        }}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
