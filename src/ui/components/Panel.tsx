import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { inkColors, icons, borderStyles } from "../theme.js";

type PanelVariant = "default" | "accent" | "subtle" | "glow" | "none";
type PanelColor = "cyan" | "magenta" | "blue" | "green" | "yellow" | "red" | "gray" | "white";

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  titleIcon?: string;
  variant?: PanelVariant;
  color?: PanelColor;
  footer?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  paddingX?: number;
  paddingY?: number;
  marginBottom?: number;
  width?: number | string;
}

const variantBorders: Record<PanelVariant, "round" | "double" | "single" | undefined> = {
  default: "round",
  accent: "double",
  subtle: "single",
  glow: "round",
  none: undefined,
};

export function Panel({
  children,
  title,
  titleIcon,
  variant = "default",
  color = "cyan",
  footer,
  collapsible = false,
  defaultCollapsed = false,
  paddingX = 1,
  paddingY = 0,
  marginBottom = 1,
  width,
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useInput(
    (input, key) => {
      if (collapsible && (key.return || input === " ")) {
        setCollapsed((c) => !c);
      }
    },
    { isActive: collapsible }
  );

  const borderStyle = variantBorders[variant];
  const showBorder = variant !== "none";

  // Glow effect uses brighter color
  const borderColor = variant === "glow" ? color : color;

  return (
    <Box
      flexDirection="column"
      borderStyle={showBorder ? borderStyle : undefined}
      borderColor={showBorder ? borderColor : undefined}
      paddingX={paddingX}
      paddingY={paddingY}
      marginBottom={marginBottom}
      width={width}
    >
      {/* Header */}
      {title && (
        <Box marginBottom={collapsed ? 0 : 1}>
          <Text color={color} bold>
            {titleIcon && `${titleIcon} `}
            {title}
          </Text>
          {collapsible && (
            <Text color="gray">
              {" "}
              {collapsed ? icons.arrowRight : icons.arrowDown}
            </Text>
          )}
        </Box>
      )}

      {/* Content */}
      {!collapsed && (
        <Box flexDirection="column">{children}</Box>
      )}

      {/* Footer */}
      {!collapsed && footer && (
        <Box marginTop={1} borderStyle="single" borderColor="gray" borderTop borderBottom={false} borderLeft={false} borderRight={false}>
          {footer}
        </Box>
      )}
    </Box>
  );
}

// Preset panel styles
export function InfoPanel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <Panel title={title} titleIcon={icons.info} color="cyan" variant="subtle">
      {children}
    </Panel>
  );
}

export function SuccessPanel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <Panel title={title} titleIcon={icons.success} color="green" variant="default">
      {children}
    </Panel>
  );
}

export function WarningPanel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <Panel title={title} titleIcon={icons.warning} color="yellow" variant="default">
      {children}
    </Panel>
  );
}

export function ErrorPanel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <Panel title={title} titleIcon={icons.error} color="red" variant="accent">
      {children}
    </Panel>
  );
}

// Floating panel with shadow effect (simulated)
export function FloatingPanel({
  children,
  title,
  titleIcon,
  color = "cyan",
}: {
  children: React.ReactNode;
  title?: string;
  titleIcon?: string;
  color?: PanelColor;
}) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Shadow layer (offset) */}
      <Box position="relative">
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={color}
          paddingX={1}
        >
          {title && (
            <Box marginBottom={1}>
              <Text color={color} bold>
                {titleIcon && `${titleIcon} `}
                {title}
              </Text>
            </Box>
          )}
          <Box flexDirection="column">{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
