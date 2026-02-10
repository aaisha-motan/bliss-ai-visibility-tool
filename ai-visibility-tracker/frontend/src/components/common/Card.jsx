import { useTheme } from '../../context/ThemeContext';

function Card({
  children,
  title,
  subtitle,
  headerAction,
  padding = true,
  hover = false,
  onClick,
  style = {},
  ...props
}) {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...(hover && {
          ':hover': {
            borderColor: theme.blueBorder,
            background: theme.bgHover,
          },
        }),
        ...style,
      }}
      {...props}
    >
      {(title || headerAction) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div>
            {title && (
              <h3 style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: theme.text,
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: theme.textMuted,
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div style={{ padding: padding ? 20 : 0 }}>
        {children}
      </div>
    </div>
  );
}

export default Card;
