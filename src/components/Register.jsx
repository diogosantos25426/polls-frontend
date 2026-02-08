import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:4000/api";
  const styles = {
    wrapper: {
      height: "calc(100vh - 75px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#050505",
      color: "white",
      fontFamily: "sans-serif",
      padding: "20px"
    },
    card: {
      width: "100%",
      maxWidth: "630px",
      backgroundColor: "rgba(20, 20, 30, 0.8)",
      padding: "25px 40px",
      borderRadius: "24px",
      border: "1px solid rgba(99, 102, 241, 0.2)",
      boxShadow: "0 20px 60px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      animation: "slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
    },
    title: {
      fontSize: "2.2rem",
      fontWeight: "900",
      textAlign: "center",
      marginBottom: "10px",
      background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text"
    },
    subtitle: {
      color: "#888",
      textAlign: "center",
      marginBottom: "30px",
      fontSize: "0.95rem",
      lineHeight: "1.5"
    },
    label: {
      display: "block",
      color: "#aaa",
      fontSize: "0.85rem",
      marginBottom: "8px",
      fontWeight: "600",
      transition: "color 0.2s ease"
    },
    input: {
      width: "100%",
      backgroundColor: "rgba(26, 26, 35, 0.5)",
      border: "1px solid rgba(99, 102, 241, 0.2)",
      borderRadius: "12px",
      padding: "12px 14px",
      color: "white",
      fontSize: "1rem",
      marginBottom: "18px",
      outline: "none",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      backdropFilter: "blur(10px)"
    },
    btn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#4338ca",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontWeight: "bold",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      marginTop: "10px",
      boxShadow: "0 4px 12px rgba(67, 56, 202, 0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px"
    },
    feedback: (type) => ({
      padding: "14px 16px",
      borderRadius: "12px",
      marginBottom: "20px",
      textAlign: "center",
      fontSize: "0.9rem",
      backgroundColor: type === "success" ? "rgba(67, 56, 202, 0.1)" : "rgba(239, 68, 68, 0.1)",
      color: type === "success" ? "#4338ca" : "#ef4444",
      border: `1px solid ${type === "success" ? "rgba(67, 56, 202, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
      animation: "slideInUp 0.3s ease-out"
    })
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!username.trim() || password.length < 6) {
      setFeedback({
        type: "error",
        text: "Username obrigatório e password com pelo menos 6 caracteres."
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Erro no registo");
      }

      setFeedback({ type: "success", text: "✓ Conta criada com sucesso! A redirecionar..." });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setFeedback({ type: "error", text: "✕ " + err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input:focus {
          border-color: #4338ca !important;
          box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.1) !important;
          background-color: rgba(26, 26, 35, 0.7) !important;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(67, 56, 202, 0.4) !important;
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        a {
          transition: all 0.3s ease;
        }

        a:hover {
          color: #818cf8;
        }
      `}</style>

      <div style={styles.card}>
        <h1 style={styles.title}>Registar-se</h1>
        <p style={styles.subtitle}>Junta-te à nossa comunidade de sondagens interativas</p>

        {feedback && (
          <div style={styles.feedback(feedback.type)}>
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label 
            style={{
              ...styles.label, 
              color: focusedField === "username" ? "#6366f1" : "#aaa"
            }}
          >
            USERNAME
          </label>
          <input
            style={{
              ...styles.input,
              borderColor: focusedField === "username" ? "#4338ca" : "rgba(99, 102, 241, 0.2)",
              backgroundColor: focusedField === "username" ? "rgba(67, 56, 202, 0.05)" : "rgba(26, 26, 35, 0.5)"
            }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
            placeholder="Ex: joao_silva"
            required
          />

          <label 
            style={{
              ...styles.label, 
              color: focusedField === "email" ? "#6366f1" : "#aaa"
            }}
          >
            EMAIL (OPCIONAL)
          </label>
          <input
            style={{
              ...styles.input,
              borderColor: focusedField === "email" ? "#4338ca" : "rgba(99, 102, 241, 0.2)",
              backgroundColor: focusedField === "email" ? "rgba(67, 56, 202, 0.05)" : "rgba(26, 26, 35, 0.5)"
            }}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            placeholder="teu@email.com"
          />

          <label 
            style={{
              ...styles.label, 
              color: focusedField === "password" ? "#6366f1" : "#aaa"
            }}
          >
            PASSWORD
          </label>
          <input
            style={{
              ...styles.input,
              borderColor: focusedField === "password" ? "#4338ca" : "rgba(99, 102, 241, 0.2)",
              backgroundColor: focusedField === "password" ? "rgba(67, 56, 202, 0.05)" : "rgba(26, 26, 35, 0.5)"
            }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            placeholder="Mínimo 6 caracteres"
            required
          />

          <button 
            style={{
              ...styles.btn, 
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
                A criar conta...
              </>
            ) : (
              "🚀 Criar Conta Grátis"
            )}
          </button>
        </form>

        <div style={{ marginTop: "25px", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
          Já tens uma conta?{" "}
          <span 
            onClick={() => navigate("/login")} 
            style={{ color: "#4338ca", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s ease" }}
          >
            Entra aqui
          </span>
        </div>
      </div>
    </div>
  );
}
