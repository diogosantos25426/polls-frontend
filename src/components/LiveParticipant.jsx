import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

export default function LiveParticipant() {
  const { pollId } = useParams();
  const location = useLocation();
  
  // Recuperar o nome que o aluno escreveu no Lobby
  const participantName = location.state?.participantName || "Anónimo";
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [message, setMessage] = useState("A aguardar pergunta...");

  const socketRef = useRef(null);
  
  // --- CONFIGURAÇÃO DE REDE ---
  const NETWORK_IP = "192.168.1.224";
  const API_BASE = `http://${NETWORK_IP}:4000`;

  useEffect(() => {
    // 1. Conectar ao Socket no IP do teu PC
    socketRef.current = io(API_BASE);

    socketRef.current.on("connect", () => {
      // Entrar na sala da sondagem específica
      socketRef.current.emit("joinPoll", { 
        pollId: Number(pollId), 
        name: participantName 
      });
    });

    // 2. Ouvir quando uma nova pergunta é enviada pelo Host
    socketRef.current.on("newQuestion", (question) => {
      setCurrentQuestion(question);
      setHasVoted(false); // Reset para a nova pergunta
      setMessage("");
    });

    // 3. Ouvir quando a sessão termina
    socketRef.current.on("pollFinished", () => {
      setCurrentQuestion(null);
      setMessage("A sondagem terminou. Obrigado!");
    });

    return () => socketRef.current.disconnect();
  }, [pollId, participantName, API_BASE]);

  // Função para enviar o voto
  function sendVote(optionId) {
    if (hasVoted) return;

    socketRef.current.emit("submitAnswer", {
      pollId: Number(pollId),
      questionId: currentQuestion.id,
      optionId: optionId,
      participantName: participantName
    });

    setHasVoted(true);
    setMessage("Voto enviado! Aguarda pelos resultados...");
  }

  return (
    <div style={{ 
      padding: "30px", 
      background: "#111", 
      minHeight: "100vh", 
      color: "white", 
      textAlign: "center",
      fontFamily: "sans-serif" 
    }}>
      <header style={{ marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <p style={{ color: "#6366f1" }}>Sessão em Direto</p>
        <small>Utilizador: {participantName}</small>
      </header>

      {currentQuestion ? (
        <div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "30px" }}>{currentQuestion.prompt}</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                disabled={hasVoted}
                onClick={() => sendVote(option.id)}
                style={{
                  padding: "20px",
                  fontSize: "1.2rem",
                  borderRadius: "12px",
                  border: "none",
                  background: hasVoted ? "#333" : "#6366f1",
                  color: "white",
                  fontWeight: "bold",
                  opacity: hasVoted ? 0.6 : 1,
                  transition: "0.2s"
                }}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "50px" }}>
          <p style={{ fontSize: "1.2rem" }}>{message}</p>
        </div>
      )}
    </div>
  );
}