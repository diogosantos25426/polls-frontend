import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function UserProfile() {
  const { user, token, updateUser } = useContext(AuthContext);

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;

  const styles = {
    wrapper: {
      backgroundColor: "#050505",
      minHeight: "calc(100vh - 75px)", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      color: "white"
    },
    container: {
      width: "100%",
      maxWidth: "500px",
      backgroundColor: "#111",
      padding: "40px",
      borderRadius: "24px",
      border: "1px solid #222",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      marginBottom: "30px",
      textAlign: "center",
      background: "linear-gradient(to right, #6366f1, #a855f7)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    },
    label: {
      display: "block",
      color: "#888",
      fontSize: "0.85rem",
      marginBottom: "8px",
      fontWeight: "500"
    },
    input: {
      width: "100%",
      backgroundColor: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "10px",
      padding: "12px 15px",
      color: "white",
      fontSize: "1rem",
      marginBottom: "20px",
      transition: "border-color 0.2s",
      outline: "none"
    },
    btn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#10b981", 
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontWeight: "bold",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "transform 0.2s, opacity 0.2s",
      marginTop: "10px"
    },
    feedback: (type) => ({
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      textAlign: "center",
      fontSize: "0.9rem",
      backgroundColor: type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
      color: type === "success" ? "#10b981" : "#ef4444",
      border: `1px solid ${type === "success" ? "#10b981" : "#ef4444"}`
    }),
    avatarPlaceholder: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      backgroundColor: "#222",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "2rem",
      margin: "0 auto 20px auto",
      border: "2px solid #6366f1",
      color: "#6366f1"
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email, password: password || undefined }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar perfil");

      const updatedUser = await res.json();
      updateUser(updatedUser);
      setPassword("");
      setFeedback({ type: "success", text: "Alterações guardadas com sucesso!" });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.avatarPlaceholder}>
          {username.charAt(0).toUpperCase()}
        </div>
        
        <h2 style={styles.title}>Definições de Perfil</h2>

        {feedback && (
          <div style={styles.feedback(feedback.type)}>
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>NOME DE UTILIZADOR</label>
          <input
            style={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = "#6366f1"}
            onBlur={(e) => e.target.style.borderColor = "#333"}
            required
          />

          <label style={styles.label}>EMAIL</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = "#6366f1"}
            onBlur={(e) => e.target.style.borderColor = "#333"}
            required
          />

          <label style={styles.label}>NOVA PALAVRA-PASSE</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Deixe em branco para manter a atual"
            onFocus={(e) => e.target.style.borderColor = "#6366f1"}
            onBlur={(e) => e.target.style.borderColor = "#333"}
          />

          <button 
            style={{...styles.btn, opacity: saving ? 0.7 : 1}} 
            type="submit" 
            disabled={saving}
          >
            {saving ? "A guardar..." : "Atualizar Perfil"}
          </button>
        </form>
        
        <p style={{ textAlign: "center", color: "#444", fontSize: "0.8rem", marginTop: "20px" }}>
          ID de Utilizador: #{user?.id}
        </p>
      </div>
    </div>
  );
}