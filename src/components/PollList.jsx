import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { Modal } from "./ui/Modal";

export default function PollList() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todas");
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });

  const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;

  const styles = {
    wrapper: { backgroundColor: "#050505", minHeight: "100vh", padding: "40px 20px", color: "white", fontFamily: "sans-serif" },
    container: { maxWidth: "1100px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
    title: { fontSize: "2.2rem", color: "#6366f1", margin: 0 },
    createBtn: { backgroundColor: "#4338ca", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", border: "none", cursor: "pointer" },
    tabBar: { display: "flex", gap: "15px", marginBottom: "30px", borderBottom: "1px solid #222", paddingBottom: "15px" },
    tab: (active) => ({
      padding: "8px 16px",
      borderRadius: "20px",
      cursor: "pointer",
      background: active ? "#6366f1" : "transparent",
      color: active ? "white" : "#666",
      border: active ? "1px solid #6366f1" : "1px solid #333",
      fontSize: "0.9rem",
      transition: "0.3s"
    }),
    voteBtn: {
      background: "#6366f1",
      border: "none",
      color: "white",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "8px",
      fontSize: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "0.2s",
      textDecoration: "none"
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" },
    // Alterado para divStyle (não Link)
    card: { 
      backgroundColor: "#111", 
      border: "1px solid #333", 
      borderRadius: "16px", 
      padding: "25px", 
      cursor: "pointer", 
      transition: "all 0.3s ease", 
      display: "flex", 
      flexDirection: "column", 
      position: "relative" 
    },
    pollTitle: { fontSize: "1.4rem", marginBottom: "10px", color: "#fff", paddingRight: "80px" },
    description: { color: "#888", lineHeight: "1.5", fontSize: "0.95rem", marginBottom: "20px", flexGrow: 1 },
    actionArea: { position: "absolute", top: "20px", right: "20px", display: "flex", gap: "8px", zIndex: 10 },
    iconBtn: (color) => ({
      background: "#1a1a1a",
      border: "1px solid #333",
      color: color,
      cursor: "pointer",
      padding: "8px",
      borderRadius: "8px",
      fontSize: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "0.2s"
    })
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPolls(data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const handleDuplicate = async (e, pollId) => {
    e.stopPropagation();
    setModal({
      show: true,
      title: "Duplicar Sondagem",
      message: "Tens a certeza que queres duplicar esta sondagem?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/polls/${pollId}/duplicate`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            load();
            setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
          }
        } catch (err) {
          setModal({
            show: true,
            title: "Erro",
            message: "Erro de rede.",
            type: "error",
            onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
          });
        }
      },
      onCancel: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  };

  const handleDelete = async (e, pollId, pollTitle) => {
    e.stopPropagation();
    setModal({
      show: true,
      title: "Eliminar Sondagem",
      message: `Tens a certeza que queres eliminar "${pollTitle}"? Esta ação não pode ser desfeita.`,
      type: "confirm",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/polls/${pollId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setPolls(polls.filter(p => p.id !== pollId));
            setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
          }
        } catch (err) {
          setModal({
            show: true,
            title: "Erro",
            message: "Erro ao eliminar.",
            type: "error",
            onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
          });
        }
      },
      onCancel: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  };

  const sections = ["Todas", "Recentes"];
  const filteredPolls = polls.filter(p => {
    if (filter === "Todas") return true;

    if (filter === "Recentes") {
      const created = p.created_at ?? p.createdAt ?? p.created ?? null;
      if (!created) return false;
      const createdTs = new Date(created).getTime();
      if (isNaN(createdTs)) return false;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return createdTs > oneDayAgo;
    }

    if (filter === "Individuais") {
      if (typeof p.mode === 'string') return p.mode.toLowerCase().includes('individual');
      if (typeof p.isIndividual === 'boolean') return p.isIndividual;
      return !p.mode;
    }

    return true;
  });

  return (
    <div style={styles.wrapper} className="poll-wrapper">
      <style>{`
        @media (max-width: 1024px) {
          .poll-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .poll-grid {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }

          .poll-title {
            font-size: 1.2rem !important;
            padding-right: 0 !important;
          }

          .poll-header {
            flex-direction: column !important;
            gap: 15px !important;
            align-items: flex-start !important;
          }

          .create-btn {
            width: 100% !important;
            text-align: center !important;
          }

          .tab-bar {
            overflow-x: auto !important;
            gap: 8px !important;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }

          .tab-item {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }

          .action-area {
            position: static !important;
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 15px !important;
            flex-wrap: wrap !important;
          }

          .poll-card {
            position: relative !important;
          }

          .poll-description {
            font-size: 0.9rem !important;
          }

          .poll-footer {
            flex-direction: column !important;
            gap: 10px !important;
          }

          .poll-stats {
            font-size: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          .poll-wrapper {
            padding: 20px 10px !important;
          }

          .poll-title-main {
            font-size: 1.8rem !important;
          }

          .tab-bar {
            margin-bottom: 20px !important;
          }

          .poll-grid {
            gap: 10px !important;
          }

          .action-area button,
          .action-area a {
            padding: 10px !important;
            font-size: 1.2rem !important;
          }
        }
      `}</style>

      <div style={styles.container}>
        <Modal
          show={modal.show}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          confirmText="Confirmar"
          cancelText="Cancelar"
        />
        <header style={{...styles.header}}>
          <h2 style={{...styles.title}}>Painel de Controlo</h2>
          <Link to="/create-poll" style={{...styles.createBtn}}>+ Criar Sondagem</Link>
        </header>

        <div style={{...styles.tabBar}} className="tab-bar">
          {sections.map(s => (
            <div 
              key={s} 
              style={{...styles.tab(filter === s)}}
              className="tab-item"
              onClick={() => setFilter(s)}
            >
              {s}
            </div>
          ))}
        </div>

        {!filteredPolls.length ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#111', borderRadius: '20px' }}>
            <p style={{ color: '#555' }}>Nenhuma sondagem encontrada.</p>
          </div>
        ) : (
          <div style={{...styles.grid}} className="poll-grid">
            {filteredPolls.map(p => (
              <div 
                key={p.id} 
                style={{...styles.card}}
                className="poll-card"
                onClick={() => navigate(`/poll/${p.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#333"}
              >
                <div style={{...styles.actionArea}} className="action-area">
                  {/* BOTÃO RESPONDER */}
                  <Link 
                    to={`/respond/${p.id}`} 
                    title="Responder"
                    style={styles.voteBtn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ✍️
                  </Link>

                  <button 
                    title="Duplicar"
                    style={styles.iconBtn("#10b981")} 
                    onClick={(e) => handleDuplicate(e, p.id)}
                  >
                    📋
                  </button>

                  <button 
                    title="Apagar"
                    style={styles.iconBtn("#ff4444")} 
                    onClick={(e) => handleDelete(e, p.id, p.title)}
                  >
                    🗑️
                  </button>
                </div>

                <div>
                  <div style={{ color: '#6366f1', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {p.mode?.toUpperCase() || "POLL"}
                  </div>
                  <h3 style={{...styles.pollTitle}} className="poll-title">{p.title}</h3>
                  <p style={{...styles.description}} className="poll-description">{p.description || "Sem descrição."}</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '1px solid #222', paddingTop: '15px', marginTop: 'auto' }} className="poll-footer">
                  <div style={{ display: 'flex', gap: '10px', color: '#555', fontSize: '0.8rem', flexWrap: 'wrap' }} className="poll-stats">
                    <span>🆔 #{p.id}</span>
                  
                  </div>
                  <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Abrir →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}