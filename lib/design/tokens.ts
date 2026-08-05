export const colors = {
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  primarySoft: "#EEF2FF",
  accent: "#3B82F6",

  success: "#10B981",
  successSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FFFBEB",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  border: "#E2E8F0",

  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
} as const;

export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
} as const;

export const radius = {
  sm: "0.625rem",
  md: "0.875rem",
  lg: "1.125rem",
  xl: "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
  md: "0 8px 24px -12px rgb(15 23 42 / 0.18)",
  lg: "0 24px 64px -24px rgb(15 23 42 / 0.28)",
} as const;

export const motion = {
  hover: 150,
  standard: 200,
  overlay: 250,
  toast: 300,
} as const;

export const typography = {
  fontFamily:
    'Inter, Geist, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const designTokens = {
  colors,
  spacing,
  radius,
  shadows,
  motion,
  typography,
} as const;

export type DesignTokens = typeof designTokens;
