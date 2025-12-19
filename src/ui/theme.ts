/**
 * Theme system for Bootstrap CLI
 * Clean, minimal aesthetic inspired by modern terminal tools
 */

// Sophisticated color palette - muted with accent
export const colors = {
  // Primary accent (subtle cyan/blue)
  primary: "#5FAFFF",
  accent: "#87AFFF",

  // Semantic colors (muted, professional)
  success: "#87D787",
  warning: "#D7AF5F",
  error: "#D75F5F",
  info: "#5FAFAF",

  // Neutrals
  text: {
    primary: "white",
    secondary: "gray",
    muted: "#666666",
  },
} as const;

// Ink-compatible color names
export const inkColors = {
  primary: "cyan",
  accent: "blue",
  success: "green",
  warning: "yellow",
  error: "red",
  info: "cyan",
  muted: "gray",
  subtle: "gray",
} as const;

// Clean Unicode symbols (no emojis)
export const icons = {
  // Status indicators
  success: "✓",
  error: "✗",
  warning: "!",
  info: "i",

  // Progress states
  pending: "○",
  inProgress: "●",
  completed: "●",

  // Navigation & structure
  arrow: "→",
  arrowRight: "›",
  arrowDown: "v",
  arrowUp: "^",
  chevron: ">",
  bullet: "·",
  dot: "·",
  pipe: "│",
  dash: "─",

  // Mode indicators
  command: ">",
  file: "+",
  shell: "$",

  // Decorative (minimal)
  section: "■",
  marker: "▪",

  // Spinner frames (clean dots)
  spinnerDots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  spinnerLine: ["-", "\\", "|", "/"],
  spinnerPulse: ["○", "◐", "●", "◑"],
} as const;

// Border style presets
export const borderStyles = {
  default: "round" as const,
  accent: "single" as const,
  subtle: "single" as const,
} as const;

// Spacing constants
export const spacing = {
  xs: 0,
  sm: 1,
  md: 2,
  lg: 3,
} as const;

// App branding
export const brand = {
  name: "Bootstrap",
  // Clean, minimal ASCII logo
  logo: `
 ┌┐ ┌─┐┌─┐┌┬┐┌─┐┌┬┐┬─┐┌─┐┌─┐
 ├┴┐│ ││ │ │ └─┐ │ ├┬┘├─┤├─┘
 └─┘└─┘└─┘ ┴ └─┘ ┴ ┴└─┴ ┴┴  `,
  tagline: "AI-powered coding assistant",
  version: "1.0.0",
} as const;

// Helper to create a clean separator
export function createSeparator(width: number = 60): string {
  return icons.dash.repeat(width);
}

// Helper to format relative time
export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  return new Date(timestamp).toLocaleDateString();
}

// Helper to format elapsed time
export function formatElapsedTime(startTime: number): string {
  const elapsed = (Date.now() - startTime) / 1000;

  if (elapsed < 1) return `${Math.floor(elapsed * 1000)}ms`;
  if (elapsed < 60) return `${elapsed.toFixed(1)}s`;

  const minutes = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  return `${minutes}m ${secs}s`;
}

// Export types
export type ThemeColor = keyof typeof inkColors;
export type IconName = keyof typeof icons;
