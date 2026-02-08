import React, { useEffect, useState } from "react";
import { theme } from "../../theme";

export function Toast({ 
  message, 
  type = "info", 
  duration = 3000, 
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: "rgba(16, 185, 129, 0.1)",
      border: theme.colors.success,
      color: theme.colors.success,
      icon: "✓",
    },
    error: {
      bg: "rgba(239, 68, 68, 0.1)",
      border: theme.colors.danger,
      color: theme.colors.danger,
      icon: "✕",
    },
    info: {
      bg: "rgba(59, 130, 246, 0.1)",
      border: theme.colors.info,
      color: theme.colors.info,
      icon: "ℹ",
    },
    warning: {
      bg: "rgba(245, 158, 11, 0.1)",
      border: theme.colors.warning,
      color: theme.colors.warning,
      icon: "⚠",
    },
  };

  const style = typeStyles[type];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        color: style.color,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.md,
        minWidth: "300px",
        boxShadow: theme.shadows.lg,
        zIndex: 10000,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <span style={{ fontSize: "1.2rem" }}>{style.icon}</span>
      <p style={{ margin: 0, flex: 1 }}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error", 5000),
    warning: (msg) => showToast(msg, "warning"),
    info: (msg) => showToast(msg, "info"),
  };
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
