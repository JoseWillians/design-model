export const colors = {
  background: {
    canvas: "#F6F8FB",
    app: "#EEF2F6",
    elevated: "#FFFFFF",
    inverse: "#111827",
  },
  foreground: {
    primary: "#111827",
    secondary: "#4B5563",
    muted: "#6B7280",
    inverse: "#FFFFFF",
  },
  border: {
    subtle: "#E5E7EB",
    default: "#CBD5E1",
    strong: "#94A3B8",
  },
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    500: "#4F46E5",
    600: "#4338CA",
    700: "#3730A3",
  },
  accent: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    500: "#EA580C",
    600: "#C2410C",
    700: "#9A3412",
  },
  success: {
    surface: "#ECFDF5",
    text: "#047857",
    border: "#A7F3D0",
  },
  warning: {
    surface: "#FFFBEB",
    text: "#B45309",
    border: "#FDE68A",
  },
  danger: {
    surface: "#FEF2F2",
    text: "#B91C1C",
    border: "#FECACA",
  },
  focus: "#2563EB",
  overlay: "rgba(17, 24, 39, 0.56)",
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  lineHeight: {
    tight: "1.15",
    snug: "1.3",
    normal: "1.5",
    relaxed: "1.65",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radius = {
  xs: "0.25rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "999px",
} as const;

export const shadow = {
  xs: "0 1px 2px rgba(15, 23, 42, 0.06)",
  sm: "0 4px 12px rgba(15, 23, 42, 0.08)",
  md: "0 12px 28px rgba(15, 23, 42, 0.12)",
  lg: "0 24px 56px rgba(15, 23, 42, 0.18)",
  focus: "0 0 0 3px rgba(37, 99, 235, 0.32)",
} as const;

export const motion = {
  duration: {
    instant: "80ms",
    fast: "140ms",
    normal: "220ms",
    slow: "320ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export const zIndex = {
  base: 0,
  toolbar: 10,
  popover: 20,
  modal: 30,
  toast: 40,
} as const;

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  motion,
  zIndex,
} as const;

export type DesignTokens = typeof designTokens;
