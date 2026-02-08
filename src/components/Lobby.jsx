import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function Lobby() {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [name, setName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  useEffect(() => {
    async function fetchPollData() {
      try {
        let res = await fetch(`${API_BASE}/api/meetings/${pollId}/stats`);
        if (!res.ok) res = await fetch(`${API_BASE}/api/polls/${pollId}`);
        if (!res.ok) throw new Error("Sessão não encontrada.");
        
        const data = await res.json();
        setPoll(data.poll || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPollData();

    socketRef.current = io(API_BASE, { transports: ["websocket", "polling"] });

    // --- OS GATILHOS DE SAÍDA DO LOBBY ---
    
    socketRef.current.on("pollStarted", (data) => {
      console.log("🚀 O Host iniciou a sessão!");
      navigate(`/livepoll/${pollId}`);
    });

    socketRef.current.on("questionChanged", () => {
      navigate(`/livepoll/${pollId}`);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [pollId, navigate, API_BASE]);

  function handleJoin() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Introduz o teu nome para entrar.");
      return;
    }

    if (poll?.access === "code" && inputCode.trim() !== poll.access_code) {
      setError("Código de acesso incorreto.");
      return;
    }

    localStorage.setItem(`voter_name_${pollId}`, trimmedName);
    
    socketRef.current.emit("joinPoll", { pollId: Number(pollId), name: trimmedName });
    
    setJoined(true); 
  }

  if (loading) return <div style={styles.wrapper}>A carregar sessão...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {!joined ? (
          <>
            <div style={styles.iconBadge}>👋</div>
            <h1 style={styles.title}>{poll?.title || "Sessão Interativa"}</h1>
            <p style={styles.subtitle}>Introduz os teus dados para participar.</p>
            
            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>TEU NOME</label>
                <input
                  style={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              {poll?.access === "code" && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>CÓDIGO DA SALA</label>
                  <input
                    style={styles.input}
                    type="password"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="****"
                  />
                </div>
              )}

              {error && <p style={styles.errorText}>{error}</p>}
              <button style={styles.button} onClick={handleJoin}>ENTRAR NO LOBBY</button>
            </div>
          </>
        ) : (
          <div style={styles.waitingArea}>
            <div className="loader"></div>
            <h2 style={{ marginBottom: "10px" }}>Estás dentro, {name}!</h2>
            <p style={{ color: "#666", lineHeight: "1.5" }}>
              O apresentador ainda não iniciou a apresentação.<br/>
              Mantém esta página aberta.
            </p>
            <div style={styles.status}>
              <span className="dot"></span> Ligado à reunião #{pollId}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .loader { 
          width: 48px; height: 48px; border: 3px solid #1a1a1a; border-bottom-color: #6366f1; 
          border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; 
          margin-bottom: 20px;
        }
        @keyframes rotation { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
        .dot { 
          height: 8px; width: 8px; background-color: #6366f1; border-radius: 50%; 
          display: inline-block; margin-right: 8px; animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: "#050505",
    minHeight: "calc(100vh - 75px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
padding: "clamp(12px, 4vh, 24px)",
    color: "white",
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#0f0f0f",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid #1a1a1a",
    width: "95%",
    maxWidth: "480px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  title: { fontSize: "1.4rem", color: "#6366f1", fontWeight: "800", marginBottom: "6px" },
  subtitle: { color: "#555", fontSize: "0.85rem", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { textAlign: "left" },
  label: { fontSize: "0.75rem", color: "#444", fontWeight: "700", marginBottom: "6px", display: "block", letterSpacing: "0.4px" },
  input: { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #222", background: "#000", color: "white", fontSize: "1rem", transition: "0.2s", boxSizing: "border-box" },
  button: { width: "100%", padding: "14px", background: "#6366f1", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", fontSize: "1rem", minHeight: "44px" },
  errorText: { color: "#ff4d4d", fontSize: "0.85rem", marginTop: "4px" },
  waitingArea: { padding: "12px 0" },
  status: { marginTop: "20px", padding: "8px 14px", background: "#111", borderRadius: "999px", display: "inline-flex", alignItems: "center", fontSize: "0.85rem", color: "#6366f1", border: "1px solid #1a1a1a" }
};
