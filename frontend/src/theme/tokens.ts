/**
 * EPMS Design Tokens
 * Source of truth for styling tokens across the application.
 */
export const tokens = {
  colors: {
    // Brand - Red accents for CTA, alerts, bug status
    brand: {
      primary: '#E53E3E',
      hover: '#C53030',
      light: '#FDECEC',
      dark: '#9B2C2C',
    },
    // Layout and backgrounds
    background: {
      default: '#FFFFFF',
      sidebar: '#F7F7F8',
      panel: '#F7F7F8',
      hover: '#F2F2F3',
      darkPanel: '#111118',
    },
    // Borders
    border: {
      default: '#E5E5E7',
      hover: '#C5C5C8',
      focus: '#1A1A1A',
    },
    // Typography
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B70',
      tertiary: '#9B9B9F',
      inverted: '#FFFFFF',
    },
    // Semantic Statuses
    status: {
      todo: '#6B6B70',
      inProgress: '#2563EB',
      pendingApproval: '#D97706',
      done: '#16A34A',
    },
    // Priorities
    priority: {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#D97706',
      low: '#6B7280',
    },
  },
  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
  },
  borderRadius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
} as const;

export type DesignTokens = typeof tokens;
