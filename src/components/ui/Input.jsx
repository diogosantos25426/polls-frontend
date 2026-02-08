import React from "react";
import { theme } from "../../theme";

export function Input({
  variant = "default",
  size = "md",
  error = false,
  disabled = false,
  className = "",
  label,
  helpText,
  ...props
}) {
  const sizeStyles = {
    sm: { padding: "6px 10px", fontSize: "0.85rem" },
    md: { padding: "10px 12px", fontSize: "0.95rem" },
    lg: { padding: "12px 14px", fontSize: "1.05rem" },
  };

  const baseStyles = {
    width: "100%",
    border: `1px solid ${error ? theme.colors.danger : theme.colors.border}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.secondary,
    color: theme.colors.text.primary,
    padding: "10px 12px",
    fontSize: "0.95rem",
    transition: `all ${theme.transitions.fast}`,
    fontFamily: "inherit",
    ...sizeStyles[size],
  };

  const style = {
    ...baseStyles,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "text",
    ":focus": !disabled && {
      borderColor: error ? theme.colors.danger : theme.colors.primary,
      boxShadow: `0 0 0 3px rgba(99, 102, 241, 0.1)`,
    },
  };

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: theme.spacing.sm,
            fontSize: "0.9rem",
            fontWeight: "600",
            color: theme.colors.text.primary,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={style}
        disabled={disabled}
        {...props}
        onFocus={(e) => {
          e.target.style.borderColor = error ? theme.colors.danger : theme.colors.primary;
          e.target.style.boxShadow = `0 0 0 3px rgba(99, 102, 241, 0.1)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? theme.colors.danger : theme.colors.border;
          e.target.style.boxShadow = "none";
        }}
      />
      {error && helpText && (
        <p
          style={{
            marginTop: theme.spacing.xs,
            fontSize: "0.8rem",
            color: theme.colors.danger,
          }}
        >
          {helpText}
        </p>
      )}
      {!error && helpText && (
        <p
          style={{
            marginTop: theme.spacing.xs,
            fontSize: "0.8rem",
            color: theme.colors.text.tertiary,
          }}
        >
          {helpText}
        </p>
      )}
    </div>
  );
}

