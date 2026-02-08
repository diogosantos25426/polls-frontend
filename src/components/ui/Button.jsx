import React from "react";
import { theme } from "../../theme";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  const variantStyles = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.primary}`,
      ":hover": !disabled && { background: "#5558e3", boxShadow: theme.shadows.primary },
    },
    success: {
      background: theme.colors.success,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.success}`,
      ":hover": !disabled && { background: "#059669" },
    },
    danger: {
      background: theme.colors.danger,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.danger}`,
      ":hover": !disabled && { background: "#dc2626" },
    },
    secondary: {
      background: theme.colors.bg.tertiary,
      color: theme.colors.text.secondary,
      border: `1px solid ${theme.colors.borderLight}`,
      ":hover": !disabled && { 
        background: theme.colors.borderLight,
        color: theme.colors.text.primary,
      },
    },
    ghost: {
      background: "transparent",
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.primary}`,
      ":hover": !disabled && { background: `rgba(99, 102, 241, 0.1)` },
    },
  };

  const sizeStyles = {
    sm: { padding: "6px 12px", fontSize: "0.85rem" },
    md: { padding: "10px 20px", fontSize: "0.95rem" },
    lg: { padding: "12px 24px", fontSize: "1.05rem" },
  };

  const baseStyles = {
    padding: "10px 20px",
    border: "none",
    borderRadius: theme.radius.lg,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: "600",
    transition: `all ${theme.transitions.normal}`,
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  };

  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      style={style}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
}

