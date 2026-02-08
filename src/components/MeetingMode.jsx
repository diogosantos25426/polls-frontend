import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ui/Modal";

export default function MeetingMode() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;

  const styles = {
    wrapper: { backgroundColor: "#050505", minHeight: "100vh", padding: "40px 20px", color: "white", fontFamily: "sans-serif" },
    card: { backgroundColor: "#111", padding: "20px", borderRadius: "12px", border: "1px solid #222", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    info: { cursor: "pointer", flexGrow: 1 },
    actions: { display: "flex", gap: "10px", alignItems: "center" },
    btnLaunch: { background: "#4338ca", color: "white", padding: "10px 15px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" },
    btnReset: { background: "#4338ca", color: "white", padding: "10px 15px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" },
    btnDelete: { background: "#4338ca", color: "white", padding: "10px 15px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }
  };

  const fetchMeetings = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/meetings`)
      .then(res => res.json())
      .then(data => { setMeetings(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // --- FUNÇÃO PARA APAGAR REUNIÃO ---
  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    setModal({
      show: true,
      title: "Eliminar Reunião",
      message: "Tens a certeza que queres eliminar esta reunião?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/meetings/${id}`, { method: "DELETE" });
          if (res.ok) {
            setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
            fetchMeetings();
          } else {
            setModal({
              show: true,
              title: "Erro",
              message: "Erro ao eliminar reunião",
              type: "error",
              onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
            });
          }
        } catch (err) { 
          console.error(err);
          setModal({
            show: true,
            title: "Erro",
            message: "Erro ao eliminar reunião",
            type: "error",
            onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
          });
        }
      },
      onCancel: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  };

  const handleReset = async (e, id) => {
    e.stopPropagation();
    setModal({
      show: true,
      title: "Limpar Respostas",
      message: "Limpar todas as respostas desta reunião? Esta ação é irreversível!",
      type: "confirm",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/meetings/${id}/reset`, { method: "POST" });
          if (res.ok) setModal({
            show: true,
            title: "Sucesso",
            message: "Respostas limpas com sucesso!",
            type: "success",
            onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
          });
          else setModal({
            show: true,
            title: "Erro",
            message: "Erro ao limpar respostas",
            type: "error",
            onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
          });
        } catch (err) { console.error(err); }
      },
      onCancel: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  };

  if (loading) return <div style={styles.wrapper}>A carregar reuniões...</div>;

  return (
    <div style={styles.wrapper}>
      <style>{`
        @media (max-width: 768px) {
          .meeting-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px !important;
          }

          .meeting-info {
            width: 100% !important;
          }

          .meeting-actions {
            width: 100% !important;
            flex-wrap: wrap !important;
          }

          .meeting-actions button {
            flex: 1 !important;
            min-width: 100px !important;
          }

          .meeting-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px !important;
          }

          .meeting-title {
            font-size: 1.8rem !important;
          }

          .meeting-refresh-btn {
            width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .meeting-wrapper {
            padding: 20px 10px !important;
          }

          .meeting-title {
            font-size: 1.5rem !important;
          }

          .meeting-card {
            padding: 15px !important;
            gap: 12px !important;
          }

          .meeting-actions button {
            padding: 8px 10px !important;
            font-size: 0.85rem !important;
          }

          .meeting-card h3 {
            font-size: 1rem !important;
          }

          .meeting-card small {
            font-size: 0.75rem !important;
          }
        }
      `}</style>

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
      <div style={{ maxWidth: "900px", margin: "0 auto" }} className="meeting-wrapper">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }} className="meeting-header">
          <h1 className="meeting-title">📺 Modo Reunião</h1>
          <button onClick={fetchMeetings} style={{ background: "none", border: "1px solid #444", color: "#888", cursor: "pointer", borderRadius: "5px", padding: "8px 16px", transition: "all 0.3s ease" }} className="meeting-refresh-btn">Atualizar</button>
        </div>
        <p style={{ color: "#888" }}>Gere as tuas sessões e limpa os dados antes de começar.</p>
        
        <div style={{ marginTop: "30px" }}>
          {meetings.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", padding: "40px 20px" }}>Nenhuma reunião encontrada.</p>
          ) : (
            meetings.map(m => (
              <div key={m.id} style={styles.card} className="meeting-card">
                <div style={styles.info} className="meeting-info" onClick={() => navigate(`/meeting/${m.id}/qr`)}>
                  <h3 style={{ margin: 0, color: "#6366f1" }}>{m.title}</h3>
                  <small style={{ color: "#666" }}>📅 {new Date(m.created_at).toLocaleDateString()}</small>
                </div>

                <div style={styles.actions} className="meeting-actions">
                 
                  
                  <button 
                    title="Lançar Reunião"
                    style={{...styles.btnLaunch, transition: "all 0.3s ease"}}
                    onClick={() => navigate(`/meeting/${m.id}/qr`)}
                    onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >
                    🚀 Lançar
                  </button>

                  <button 
                    title="Eliminar"
                    style={{...styles.btnDelete, transition: "all 0.3s ease"}}
                    onClick={(e) => handleDelete(e, m.id)}
                    onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}