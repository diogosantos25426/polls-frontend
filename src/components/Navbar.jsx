import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { theme } from "../theme";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const styles = {
    header: {
      backgroundColor: "rgba(10, 10, 10, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: `1px solid ${theme.colors.border}`,
      position: "sticky",
      top: 0,
      zIndex: 1000,
      padding: "0 20px"
    },
    inner: {
      maxWidth: "1200px",
      margin: "0 auto",
      height: "75px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    brand: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "none",
      border: "none",
      cursor: "pointer",
      transition: `all ${theme.transitions.normal}`,
    },
    nav: {
      display: "flex",
      gap: theme.spacing.xl,
      alignItems: "center",
    },
    link: {
      color: theme.colors.text.secondary,
      textDecoration: "none",
      fontSize: "0.95rem",
      fontWeight: "500",
      transition: `all ${theme.transitions.normal}`,
      padding: "8px 0",
      borderBottom: `2px solid transparent`,
    },
    activeLink: {
      color: theme.colors.primary,
      borderBottom: `2px solid ${theme.colors.primary}`,
    },
    userLink: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing.sm,
      color: theme.colors.success,
      textDecoration: "none",
      fontWeight: "600",
      fontSize: "0.95rem",
      padding: "8px 12px",
      borderRadius: theme.radius.lg,
      backgroundColor: `rgba(67, 56, 202, 0.2)`,
      transition: `all ${theme.transitions.normal}`,
      border: "1px solid rgba(67, 56, 202, 0.2)",
    },
    logoutBtn: {
      background: "transparent",
      color: theme.colors.danger,
      border: `1px solid rgba(239, 68, 68, 0.4)`,
      padding: "8px 16px",
      borderRadius: theme.radius.lg,
      cursor: "pointer",
      fontSize: "0.85rem",
      fontWeight: "bold",
      transition: `all ${theme.transitions.normal}`,
    },
    hamburger: {
      display: "none",
      flexDirection: "column",
      gap: "5px",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "8px",
      zIndex: 1001,
    },
    hamburgerLine: {
      width: "25px",
      height: "3px",
      backgroundColor: theme.colors.primary,
      borderRadius: "2px",
      transition: "all 0.3s ease"
    }
  };

  const LogoComponent = () => (
    <div 
      style={styles.brand} 
      onClick={() => navigate("/")}
      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #818cf8 100%)`,
        width: "40px",
        height: "40px",
        borderRadius: theme.radius.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "1.3rem",
        boxShadow: theme.shadows.primary,
      }}>
        S
      </div>
      <span style={{ 
        fontWeight: "900", 
        fontSize: "1.1rem", 
        color: "white", 
        letterSpacing: "1px" 
      }}>
        POLL<span style={{ color: theme.colors.primary }}>APP</span>
      </span>
    </div>
  );

  const NavLink_Styled = ({ to, children, isActive }) => (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        ...styles.link,
        ...(isActive && styles.activeLink)
      })}
      onMouseEnter={(e) => {
        e.target.style.color = theme.colors.primary;
      }}
      onMouseLeave={(e) => {
        e.target.style.color = theme.colors.text.secondary;
      }}
    >
      {children}
    </NavLink>
  );

  return (
    <header style={styles.header}>
      <style>{`
        @media (max-width: 768px) {
          .navbar-hamburger {
            display: flex !important;
          }

          .navbar-nav {
            display: ${isMobileMenuOpen ? "flex" : "none"} !important;
            flex-direction: column;
            position: fixed;
            top: 75px;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid ${theme.colors.border};
            gap: 0;
            padding: 20px;
            animation: slideDown 0.3s ease-out;
            z-index: 999;
          }

          .navbar-nav a,
          .navbar-nav button {
            width: 100%;
            padding: 12px 16px !important;
            text-align: left;
            border-radius: 8px;
            margin-bottom: 8px;
          }

          .navbar-nav a:hover {
            background: rgba(99, 102, 241, 0.1);
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
      
      <div style={styles.inner}>
        {/* LOGO */}
        <LogoComponent />

        {/* HAMBURGER MENU */}
        <button
          className="navbar-hamburger"
          style={styles.hamburger}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <div style={{
            ...styles.hamburgerLine,
            transform: isMobileMenuOpen ? "rotate(45deg) translateY(11px)" : "rotate(0)",
          }} />
          <div style={{
            ...styles.hamburgerLine,
            opacity: isMobileMenuOpen ? 0 : 1,
          }} />
          <div style={{
            ...styles.hamburgerLine,
            transform: isMobileMenuOpen ? "rotate(-45deg) translateY(-11px)" : "rotate(0)",
          }} />
        </button>

        {/* MENU */}
        <nav className="navbar-nav" style={styles.nav} onClick={() => setIsMobileMenuOpen(false)}>
          <NavLink_Styled to="/">Home</NavLink_Styled>

          {token && (
            <>
              <NavLink_Styled to="/polls">Minhas Sondagens</NavLink_Styled>
              <NavLink_Styled to="/create-poll">Criar</NavLink_Styled>
              <NavLink_Styled to="/meeting-mode">📺 Reunião</NavLink_Styled>

              <div style={{ 
                width: "1px", 
                height: "20px", 
                background: theme.colors.border, 
                margin: "0 10px" 
              }} />
              
              <NavLink 
                to="/profile" 
                style={({ isActive }) => ({
                  ...styles.userLink,
                  ...(isActive && {
                    backgroundColor: `rgba(67, 56, 202, 0.2)`,
                    borderColor: theme.colors.success,
                  })
                })}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `rgba(67, 56, 202, 0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = `rgba(67, 56, 202, 0.1)`;
                }}
              >
                👤 {user?.username || "Perfil"}
              </NavLink>

              <button 
                onClick={logout} 
                style={styles.logoutBtn}
                onMouseEnter={(e) => {
                  e.target.style.background = `rgba(239, 68, 68, 0.1)`;
                  e.target.style.borderColor = theme.colors.danger;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = `rgba(239, 68, 68, 0.4)`;
                }}
              >
                Sair
              </button>
            </>
          )}

          {!token && (
            <>
              <NavLink_Styled to="/login">Login</NavLink_Styled>
              <NavLink 
                to="/register" 
                style={({ isActive }) => ({
                  ...styles.link,
                  background: theme.colors.primary, 
                  color: "white", 
                  padding: "10px 20px", 
                  borderRadius: theme.radius.lg,
                  boxShadow: theme.shadows.primary,
                  borderBottom: "none",
                  ...(isActive && { borderBottom: "none" })
                })}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 15px 30px rgba(0, 0, 0, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = theme.shadows.primary;
                }}
              >
                Registar
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}