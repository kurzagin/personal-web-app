export const colors = {
  bg: '#0a0a0c',
  bgCard: '#121215',
  bgCardHover: '#18181d',
  bgCardActive: '#222228',
  border: '#27272a',
  borderLight: '#3f3f46',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  accent: '#e0a96d',
  accentHover: '#ecc195',
  accentMuted: 'rgba(224, 169, 109, 0.15)',
  danger: '#ef4444',
  success: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
} as const;

export const typography = {
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;
