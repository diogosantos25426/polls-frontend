import React from "react";
import { theme } from "../../theme";

export function Card({
  variant = "default",
  hoverable = false,
  className = "",
  children,
  ...props
}) {
  const baseStyles = {
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.bg.secondary,
    padding: theme.spacing.xl,
    transition: `all ${theme.transitions.normal}`,
  };

  const variantStyles = {
    default: {
      boxShadow: theme.shadows.sm,
    },
    elevated: {
      boxShadow: theme.shadows.lg,
    },
    outlined: {
      border: `2px solid ${theme.colors.borderLight}`,
      boxShadow: "none",
    },
  };

  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    ...(hoverable && {
      cursor: "pointer",
      ":hover": {
        boxShadow: theme.shadows.lg,
        transform: "translateY(-2px)",
      },
    }),
  };

  return (
    <div
      style={style}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.boxShadow = theme.shadows.lg;
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.boxShadow = theme.shadows.sm;
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div
      style={{
        marginBottom: theme.spacing.lg,
        borderBottom: `1px solid ${theme.colors.border}`,
        paddingBottom: theme.spacing.lg,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div
      style={{
        marginTop: theme.spacing.md,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div
      style={{
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTop: `1px solid ${theme.colors.border}`,
        display: "flex",
        gap: theme.spacing.lg,
        justifyContent: "flex-end",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

