import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium', // 'small', 'medium', 'large', 'full'
}) {
  const { theme } = useTheme();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getWidth = () => {
    switch (size) {
      case 'small':
        return 400;
      case 'large':
        return 800;
      case 'full':
        return '90vw';
      default:
        return 560;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: getWidth(),
          maxHeight: '90vh',
          background: theme.bgCard,
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease',
        }}
      >
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: theme.text,
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: 8,
                border: 'none',
                background: 'transparent',
                color: theme.textMuted,
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{
          flex: 1,
          padding: 20,
          overflowY: 'auto',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 20px',
            borderTop: `1px solid ${theme.border}`,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
