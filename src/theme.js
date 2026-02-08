// src/theme.js - Global theme constants

export const theme = {
  colors: {
    primary: "#6366f1",      // Indigo
    success: "#10b981",      // Green
    danger: "#ef4444",       // Red
    warning: "#f59e0b",      // Amber
    info: "#3b82f6",         // Blue
    
    bg: {
      primary: "#050505",    // Near black
      secondary: "#111111",  // Dark grey
      tertiary: "#1a1a1a",   // Lighter grey
    },
    
    text: {
      primary: "#ffffff",    // White
      secondary: "#aaaaaa",  // Light grey
      tertiary: "#666666",   // Medium grey
    },
    
    border: "#222222",
    borderLight: "#333333",
  },
  
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    xxxl: "40px",
  },
  
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "20px",
  },
  
  transitions: {
    fast: "0.15s ease",
    normal: "0.2s ease",
    slow: "0.3s ease",
  },
  
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
    primary: "0 10px 20px rgba(99, 102, 241, 0.3)",
  },
};

export const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    background-color: ${theme.colors.bg.primary};
    color: ${theme.colors.text.primary};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  }
  
  button, a {
    transition: all ${theme.transitions.normal};
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
