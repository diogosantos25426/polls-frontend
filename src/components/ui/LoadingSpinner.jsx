import React from "react";
import { theme } from "../../theme";

export function LoadingSpinner({ size = "md", color = theme.colors.primary }) {
  const sizes = {
    sm: 20,
    md: 40,
    lg: 60,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: sizes[size],
          height: sizes[size],
          border: `3px solid rgba(99, 102, 241, 0.2)`,
          borderTop: `3px solid ${color}`,
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
    </div>
  );
}
