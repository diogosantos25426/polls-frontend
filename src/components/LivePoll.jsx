import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

export default function LivePoll() {
  const { pollId } = useParams();
  const [question, setQuestion] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [status, setStatus] = useState("waiting"); // waiting | active | ended
  const [textInput, setTextInput] = useState("");
  const socketRef = useRef(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  useEffect(() => {
    const socket = io(API_BASE, { 
      transports: ["websocket"],
      reconnection: true 
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 [LivePoll] Conectado ao Servidor");
      const room = `poll:${pollId}`;  // Join na room uniformizada
      socket.emit("joinPoll", { pollId: Number(pollId), name: "Participante" });
      socket.emit("join", room);  // Join explícito
      console.log(`[LivePoll] Entrou na room: ${room}`);
      socket.emit("getCurrentQuestion", { pollId: Number(pollId) });
      // Notifica o host que um participante se juntou
      socket.emit("participantJoined", { pollId: Number(pollId) });
    });

    socket.on("pollStarted", (data) => {
      if (data?.questionId) {
        setStatus("active");
        setAnswered(false);
        fetchQuestionDetails(data.questionId);
      }
    });

    socket.on("currentQuestionData", (data) => {
      if (data && data.questionId) {
        setStatus("active");
        fetchQuestionDetails(data.questionId);
      } else {
        setStatus("waiting");
      }
    });

    socket.on("questionChanged", (data) => {
      setAnswered(false);
      setTextInput("");
      setStatus("active");
      fetchQuestionDetails(data.questionId);
    });

    socket.on("pollFinished", () => setStatus("ended"));

    return () => socket.disconnect();
  }, [pollId]);

  async function fetchQuestionDetails(qId) {
    try {
      const res = await fetch(`${API_BASE}/api/questions/detail/${qId}`);
      if (!res.ok) throw new Error("Erro ao buscar detalhes");
      const data = await res.json();
      
      console.log("🔍 Dados da pergunta:", data);
      setQuestion({
        ...data,
        options: data.options || []
      });
    } catch (err) {
      console.error("❌ Erro:", err);
    }
  }

 const handleVote = async (input) => {
  console.log("🟡 [LivePoll] Clique detetado. Input:", input);
  
  if (answered || !question) return;

  const type = question.type?.toLowerCase().trim();
  
  // 1. Definir o Label (o que aparece no gráfico) e o QuestionType
  let label = "";
  let value = null;

  if (type === 'scale') {
    label = String(input); // O número 1-5
  } else if (["word_cloud", "open_ended", "wordcloud", "open-ended"].includes(type)) {
    if (!textInput.trim()) return;
    label = textInput.trim(); 
    value = textInput.trim();
  } else {
    const selectedOpt = question.options.find(o => o.id === input);
    label = selectedOpt ? selectedOpt.text : "Opção Desconhecida";
  }

  const payload = {
    pollId: Number(pollId),
    questionId: question.id,
    questionType: type,
    label: label,
    value: value
  };

  console.log("📦 [LivePoll] Enviando para meeting-results:", payload);

  try {
    const res = await fetch(`${API_BASE}/api/responses/meeting-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setAnswered(true);
      socketRef.current.emit("submitAnswer", { pollId: Number(pollId) });
      console.log("[LivePoll] submitAnswer emitido para o host");
    }
  } catch (err) {
    console.error("❌ Erro ao votar:", err);
  }
};
  // --- RENDERIZADORES CONDICIONAIS ---

  const renderContent = () => {
    if (answered) {
      return (
        <div style={votedStyle}>
          <div style={{fontSize: "4rem", marginBottom: "20px"}}>✅</div>
          Voto registado!<br/>Aguarda pela próxima pergunta.
        </div>
      );
    }

    const type = question.type?.toLowerCase().trim();

    // 1. ESCALAS (1 a 5)
    if (type === 'scale') {
      return (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button key={num} onClick={() => handleVote(num)} style={{...btnStyle, minWidth: "60px", flex: 1}}>
              {num}
            </button>
          ))}
        </div>
      );
    }

    // 2. NUVEM DE PALAVRAS OU RESPOSTA ABERTA
    if (["word_cloud", "open-ended", "wordcloud"].includes(type)) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input 
            type="text" 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Escreve aqui..." 
            style={{...btnStyle, background: "#000", textAlign: "left", cursor: "text"}}
          />
          <button 
            onClick={() => handleVote(textInput)} 
            style={{...btnStyle, background: "#6366f1"}}
            disabled={!textInput.trim()}
          >
            ENVIAR RESPOSTA
          </button>
        </div>
      );
    }

    // 3. ESCOLHA MÚLTIPLA (Default)
    return (
      <div style={optionsGrid}>
        {question.options.length > 0 ? (
          question.options.map((opt) => (
            <button key={opt.id} onClick={() => handleVote(opt.id)} style={btnStyle}>
              {opt.text}
            </button>
          ))
        ) : (
          <p style={{color: "#666"}}>Sem opções disponíveis.</p>
        )}
      </div>
    );
  };

  if (status === "waiting") return <div style={msgStyle}>A aguardar que o apresentador inicie a sessão...</div>;
  if (status === "ended") return <div style={msgStyle}>Sessão terminada. Obrigado!</div>;
  if (!question) return <div style={msgStyle}>A carregar pergunta...</div>;

  return (
    <div style={containerStyle}>
      <h2 style={promptStyle}>{question.prompt}</h2>
      {renderContent()}
    </div>
  );
}

// --- ESTILOS ---
const containerStyle = { padding: "40px 20px", background: "#050505", minHeight: "100vh", color: "white", textAlign: "center", fontFamily: "sans-serif" };
const promptStyle = { fontSize: "1.8rem", marginBottom: "40px", fontWeight: "800", lineHeight: "1.2" };
const optionsGrid = { display: "flex", flexDirection: "column", gap: "15px", maxWidth: "500px", margin: "0 auto" };
const btnStyle = { padding: "20px", fontSize: "1.1rem", background: "#111", color: "white", border: "2px solid #6366f1", borderRadius: "18px", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s" };
const msgStyle = { padding: "100px 20px", color: "#6366f1", textAlign: "center", fontSize: "1.3rem", background: "#050505", minHeight: "100vh", fontWeight: "bold" };
const votedStyle = { color: "#10b981", fontSize: "1.5rem", fontWeight: "bold", marginTop: "40px", lineHeight: "1.6" };
