/**
 * Format a date string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Date(date).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Format a date with time
 * @param {string|Date} date - Date to format
 */
export function formatDateTime(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage
 * @param {number} value - Value (0-100 or 0-1)
 * @param {boolean} isDecimal - If true, value is 0-1
 */
export function formatPercentage(value, isDecimal = false) {
  const percentage = isDecimal ? value * 100 : value;
  return `${Math.round(percentage)}%`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  truncate,
};
