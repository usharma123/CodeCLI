import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { inkColors, icons } from "../theme.js";

type BadgeVariant = "success" | "warning" | "error" | "info" | "primary" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantColors: Record<BadgeVariant, keyof typeof inkColors> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  primary: "primary",
  muted: "muted",
};

export function Badge({
  children,
  variant = "primary",
  pulse = false,
}: BadgeProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!pulse) return;

    const interval = setInterval(() => {
      setVisible((v) => !v);
    }, 500);

    return () => clearInterval(interval);
  }, [pulse]);

  const color = inkColors[variantColors[variant]];

  return (
    <Text color={color} dimColor={pulse && !visible}>
      [{children}]
    </Text>
  );
}

// Preset badges
export function SafeBadge() {
  return <Badge variant="success">safe</Badge>;
}

export function DryRunBadge() {
  return <Badge variant="warning" pulse>dry-run</Badge>;
}

export function ErrorBadge({ message }: { message?: string }) {
  return <Badge variant="error">{message || "error"}</Badge>;
}

export function ModelBadge({ model }: { model: string }) {
  return <Badge variant="info">{model}</Badge>;
}

export function ModeBadge({ mode }: { mode: "command" | "file" | "shell" }) {
  const configs = {
    command: { variant: "primary" as const, text: "/" },
    file: { variant: "success" as const, text: "@" },
    shell: { variant: "warning" as const, text: "!" },
  };

  const config = configs[mode];
  return <Badge variant={config.variant}>{config.text}</Badge>;
}
