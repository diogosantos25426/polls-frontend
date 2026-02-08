import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Modal } from "./ui/Modal";
import { io } from "socket.io-client";

export default function LivePollSimple() {
  const { pollId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [voted, setVoted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
  const socketRef = useRef(null);
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:4000`;

  const sync = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${pollId}/stats`);
      const data = await res.json();
      setCurrentQuestion(data.questions[data.currentIdx || 0]);
      setVoted(false);
      setTextInput("");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    socketRef.current = io(API_BASE);
    socketRef.current.emit("joinPoll", { pollId: Number(pollId), name: "Participante" });
    socketRef.current.on("questionChanged", sync);
    sync();
    return () => socketRef.current.disconnect();
  }, [pollId]);

  const handleVote = async (value, optionId = null) => {
    try {
      await fetch(`${API_BASE}/api/live-responses/meeting-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: Number(pollId),
          questionId: currentQuestion.id,
          optionId,
          value: value.toString()
        })
      });
      setVoted(true);
    } catch (e) { 
      setModal({
        show: true,
        title: "Erro",
        message: "Erro ao votar",
        type: "error",
        onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
      });
    }
  };

  if (!currentQuestion) return <div style={styles.page}>Aguardando Host...</div>;

  return (
    <div style={styles.page}>
      <Modal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        confirmText="OK"
        cancelText="Cancelar"
      />
      {voted ? (
        <h2>Voto enviado! Aguarde...</h2>
      ) : (
        <>
          <h2 style={styles.prompt}>{currentQuestion.prompt}</h2>
          
          {currentQuestion.type === "scale" && (
            <div style={styles.grid}>
              {currentQuestion.options.map(opt => (
                <button key={opt.id} style={styles.btn} onClick={() => handleVote(opt.text, opt.id)}>
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "multiple_choice" && (
            <div style={styles.list}>
              {currentQuestion.options.map(opt => (
                <button key={opt.id} style={styles.btn} onClick={() => handleVote(opt.text, opt.id)}>
                  {opt.text}
                </button>
              ))}
            </div>
          )}

{(currentQuestion.type === "word_cloud" || currentQuestion.type === "open_ended") && (
            <div style={styles.list}>
              <input 
                style={styles.input} 
                value={textInput} 
                onChange={e => setTextInput(e.target.value)} 
                placeholder="Tua resposta..." 
              />
              <button 
                style={styles.btnMain} 
                onClick={() => handleVote(textInput)}
              >
                Enviar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: { background: "#000", minHeight: "100vh", color: "white", padding: "20px", textAlign: "center" },
  prompt: { marginBottom: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" },
  list: { display: "flex", flexDirection: "column", gap: "15px" },
  btn: { padding: "15px", background: "#6366f1", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold" },
  btnMain: { padding: "15px", background: "#10b981", color: "white", border: "none", borderRadius: "10px" },
  input: { padding: "15px", borderRadius: "10px", border: "none", marginBottom: "10px", textAlign: "center" }
};