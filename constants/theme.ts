export const COLORS = {
  // Primary palette 
  primary: '#5B8AF0',      
  primaryLight: '#EEF2FF',
  secondary: '#F87171',     
  secondaryLight: '#FEF2F2',
  accent: '#34D399',       
  accentLight: '#ECFDF5',
  warning: '#d40b0b',     
  warningLight: '#FFFBEB',
  purple: '#A78BFA',
  purpleLight: '#F5F3FF',

  // Neutrals
  bg: '#e4f3fc',
  surface: '#FFFFFF',
  border: '#E8ECF4',
  textPrimary: '#1A1F36',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Timeline pill colors
  pills: [
    '#5B8AF0', '#F87171', '#34D399', '#FBBF24',
    '#A78BFA', '#ee228c', '#38BDF8', '#FB923C',
  ],

  // Exam type colors
  examColors: {
    'Class Test': '#34D399',
    'Mid Exam': '#FBBF24',
    'Final Exam': '#f33939',
  },

  // Notice type colors
  noticeColors: {
    general: '#5B8AF0',
    emergency: '#ec1d1d',
    exam: '#be0b6e',
    event: '#34D399',
  },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
  },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ICON_MAP: Record<string, string> = {
  book: '📚',
  math: '📐',
  science: '🔬',
  english: '📝',
  history: '🏛️',
  pe: '⚽',
  art: '🎨',
  music: '🎵',
  computer: '💻',
  lab: '🧪',
  break: '☕',
  lunch: '🍱',
  prayer: '🕌',
  assembly: '🏫',
  default: '📖',
};
