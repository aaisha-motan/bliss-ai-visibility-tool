// Theme definitions
export const themes = {
  dark: {
    name: 'dark',
    bg: '#0D1117',
    bgCard: '#161B22',
    bgHover: '#1C2333',
    bgInput: '#0D1117',
    border: '#30363D',
    borderLight: '#21262D',
    text: '#E6EDF3',
    textMuted: '#7D8590',
    textDim: '#484F58',
    blue: '#0066FF',
    blueGlow: 'rgba(0,102,255,0.15)',
    blueBorder: 'rgba(0,102,255,0.3)',
    orange: '#FF9500',
    orangeGlow: 'rgba(255,149,0,0.12)',
    orangeBorder: 'rgba(255,149,0,0.25)',
    green: '#3FB950',
    greenBg: 'rgba(63,185,80,0.1)',
    red: '#F85149',
    redBg: 'rgba(248,81,73,0.1)',
    yellow: '#D29922',
    yellowBg: 'rgba(210,153,34,0.1)',
    gray: '#484F58',
    grayBg: 'rgba(72,79,88,0.15)',
  },
  light: {
    name: 'light',
    bg: '#F6F8FA',
    bgCard: '#FFFFFF',
    bgHover: '#F0F2F5',
    bgInput: '#F6F8FA',
    border: '#D0D7DE',
    borderLight: '#E8ECF0',
    text: '#1A1A2E',
    textMuted: '#57606A',
    textDim: '#8B949E',
    blue: '#0066FF',
    blueGlow: 'rgba(0,102,255,0.08)',
    blueBorder: 'rgba(0,102,255,0.25)',
    orange: '#FF9500',
    orangeGlow: 'rgba(255,149,0,0.08)',
    orangeBorder: 'rgba(255,149,0,0.2)',
    green: '#1A7F37',
    greenBg: 'rgba(26,127,55,0.08)',
    red: '#CF222E',
    redBg: 'rgba(207,34,46,0.08)',
    yellow: '#9A6700',
    yellowBg: 'rgba(154,103,0,0.08)',
    gray: '#6E7781',
    grayBg: 'rgba(110,119,129,0.08)',
  },
};

// Engine configurations
export const engines = [
  { id: 'CHATGPT', name: 'ChatGPT', icon: '◆', color: '#10A37F' },
  { id: 'PERPLEXITY', name: 'Perplexity', icon: '◈', color: '#20B2AA' },
  { id: 'GOOGLE_AIO', name: 'Google AIO', icon: '●', color: '#4285F4' },
];

// Mention type configurations
export const mentionTypes = {
  FEATURED: {
    label: 'Featured',
    color: 'green',
    score: 3,
    description: 'Brand is highlighted as a top recommendation',
  },
  MENTIONED: {
    label: 'Mentioned',
    color: 'yellow',
    score: 2,
    description: 'Brand appears but not as primary recommendation',
  },
  COMPETITOR_ONLY: {
    label: 'Competitor Only',
    color: 'red',
    score: 0,
    description: 'Competitors appear but brand is missing',
  },
  NOT_FOUND: {
    label: 'Not Found',
    color: 'gray',
    score: 0,
    description: 'No relevant mentions in response',
  },
};

// Get mention color based on type
export function getMentionColor(type, theme) {
  const colors = {
    FEATURED: theme.green,
    MENTIONED: theme.yellow,
    COMPETITOR_ONLY: theme.red,
    NOT_FOUND: theme.gray,
  };
  return colors[type] || theme.gray;
}

// Get mention background based on type
export function getMentionBg(type, theme) {
  const colors = {
    FEATURED: theme.greenBg,
    MENTIONED: theme.yellowBg,
    COMPETITOR_ONLY: theme.redBg,
    NOT_FOUND: theme.grayBg,
  };
  return colors[type] || theme.grayBg;
}

export default themes;
