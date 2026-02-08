import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../theme";

export default function HomePage() {
  const navigate = useNavigate();

  const styles = {
    wrapper: {
      backgroundColor: theme.colors.bg.primary,
      color: theme.colors.text.primary,
      minHeight: "calc(100vh - 75px)",
      fontFamily: "inherit",
      overflow: "hidden",
    },
    hero: {
      textAlign: "center",
      padding: "80px 20px 120px",
      background: `radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, ${theme.colors.bg.primary} 70%)`,
      position: "relative",
    },
    heroContent: {
      maxWidth: "800px",
      margin: "0 auto",
      animation: "fadeInUp 0.8s ease-out",
    },
    title: {
      fontSize: "clamp(2.5rem, 8vw, 4rem)",
      fontWeight: "900",
      marginBottom: theme.spacing.xl,
      letterSpacing: "-2px",
      lineHeight: "1.2",
    },
    titleHighlight: {
      color: theme.colors.primary,
      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #818cf8 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    subtitle: {
      fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
      color: theme.colors.text.secondary,
      maxWidth: "600px",
      margin: "0 auto 40px",
      lineHeight: "1.8",
      fontWeight: "400",
    },
    ctaButton: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.text.primary,
      padding: "16px 40px",
      borderRadius: theme.radius.full,
      fontSize: "1.1rem",
      fontWeight: "700",
      border: "none",
      cursor: "pointer",
      boxShadow: theme.shadows.primary,
      transition: `all ${theme.transitions.normal}`,
      display: "inline-block",
    },
    features: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: theme.spacing.xl,
      maxWidth: "1200px",
      margin: "0 auto",
      padding: `60px 20px`,
    },
    featureCard: {
      backgroundColor: theme.colors.bg.secondary,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
      border: `1px solid ${theme.colors.border}`,
      textAlign: "center",
      transition: `all ${theme.transitions.normal}`,
      cursor: "pointer",
      animation: "fadeInUp 0.8s ease-out",
    },
    icon: {
      fontSize: "3rem",
      marginBottom: theme.spacing.lg,
      display: "block",
    },
    featureTitle: {
      fontSize: "1.3rem",
      fontWeight: "700",
      marginBottom: theme.spacing.md,
      color: theme.colors.text.primary,
    },
    featureText: {
      color: theme.colors.text.secondary,
      lineHeight: "1.6",
      fontSize: "0.95rem",
    },
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4) !important;
        }

        [data-feature]:hover {
          border-color: ${theme.colors.primary};
          background-color: ${theme.colors.bg.tertiary};
          transform: translateY(-5px);
        }
      `}</style>

      {/* HERO SECTION */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>
            Sondagens em <span style={styles.titleHighlight}>Tempo Real</span>
          </h1>
          <p style={styles.subtitle}>
            Crie, partilhe e analise resultados instantaneamente. A ferramenta perfeita para reuniões, 
            eventos e salas de aula interativas.
          </p>
          <button
            style={styles.ctaButton}
            onClick={() => navigate("/register")}
          >
            Começar Gratuitamente →
          </button>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={styles.features}>
        <div 
          style={styles.featureCard}
          data-feature
          onClick={() => navigate("/create-poll")}
        >
          <span style={styles.icon}>✍️</span>
          <h3 style={styles.featureTitle}>Crie em Segundos</h3>
          <p style={styles.featureText}>
            Interface intuitiva para criar perguntas de escolha múltipla, escala ou nuvem de palavras
          </p>
        </div>

        <div 
          style={styles.featureCard}
          data-feature
          onClick={() => navigate("/polls")}
        >
          <span style={styles.icon}>📱</span>
          <h3 style={styles.featureTitle}>Partilha via QR Code</h3>
          <p style={styles.featureText}>
            O seu público só precisa de ler o código para começar a votar. Sem apps, sem registo.
          </p>
        </div>

        <div 
          style={styles.featureCard}
          data-feature
        >
          <span style={styles.icon}>📊</span>
          <h3 style={styles.featureTitle}>Análise Live</h3>
          <p style={styles.featureText}>
            Veja os gráficos a crescerem à medida que os votos entram. Exporte tudo para PDF.
          </p>
        </div>
      </section>
    </div>
  );
}
