import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { theme } from "../theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function MeetingHost() {
  const { pollId } = useParams();
  const [stats, setStats] = useState(null);
  const [view, setView] = useState("question");
  const [participantCount, setParticipantCount] = useState(0);
  const socketRef = useRef(null);
const [isFinished, setIsFinished] = useState(false);
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1 },
        grid: { color: theme.colors.border }
      },
      x: {
        grid: { color: theme.colors.border }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: `rgba(0, 0, 0, 0.8)`,
        titleColor: theme.colors.text.primary,
        bodyColor: theme.colors.text.primary,
      }
    }
  };

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${pollId}/stats`);
      const data = await res.json();
      console.log("📊 [HOST] stats:", data);
      if (data && data.questions && data.currentIdx >= data.questions.length) {
      setIsFinished(true);
    } else {
      setIsFinished(false);
    }
      
      if (data?.questions?.[0]) {
        console.log("🔍 [HOST] Primeira questão:", {
          id: data.questions[0].id,
          type: data.questions[0].type,
          responses: data.questions[0].responses,
          options: data.questions[0].options,
        });
      }
      
      setStats(data);
    } catch (err) {
      console.error("❌ Erro ao buscar stats:", err);
    }
  }

  useEffect(() => {

    socketRef.current = io(API_BASE, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
  const room = `poll:${pollId}`;
  socketRef.current.emit("joinPoll", { pollId: Number(pollId), name: "HOST" });
  socketRef.current.emit("requestParticipantCount", { pollId: Number(pollId) });
});
socketRef.current.on("pollFinished", () => {
      setIsFinished(true);
    });
    
socketRef.current.on("roomStats", (data) => {
  console.log("📊 [HOST] Stats da sala recebidos:", data);
  setParticipantCount(data.count || 0);
});

socketRef.current.on("participantJoined", (data) => {
  if (data?.name !== "HOST") {
    if (data.totalCount) setParticipantCount(data.totalCount);
    else setParticipantCount(prev => prev + 1);
  }
});

socketRef.current.on("questionChanged", () => {
  setView("question");
  fetchStats();
});

    socketRef.current.on("showResults", () => {
      console.log("📊 [HOST] Mostrar resultados");
      setView("results");
      fetchStats();
    });

    fetchStats();
    return () => socketRef.current.disconnect();
  }, [pollId]);

useEffect(() => {
    if (isFinished) return; // Se terminou, não inicia o timer

    console.log("⏱️ Timer de atualização ativo");
    const interval = setInterval(() => {
      fetchStats();
    }, 2000);

    return () => {
      console.log("🛑 Timer de atualização desligado");
      clearInterval(interval);
    };
  }, [pollId, isFinished]);

  const renderChart = (q) => {
    if (!q) return <p style={styles.noData}>Sem pergunta</p>;

    const type = q.type?.replace("-", "_").toLowerCase();
    const responses = q.responses || [];
    const options = q.options || [];

    /* ───────── WORD CLOUD ───────── */
    if (["word_cloud", "open_ended", "wordcloud"].includes(type)) {
      const counts = {};
      responses.forEach(r => {
        const raw = r.label || r.value; 
        if (!raw) return;

        const key = raw.trim();
        counts[key] = (counts[key] || 0) + 1;
      });

      if (!Object.keys(counts).length) return <p style={styles.noData}>Aguardando respostas…</p>;

      return (
        <div style={styles.wordCloudContainer}>
          {Object.entries(counts).map(([text, count]) => (
            <span key={text} style={{
                fontSize: `${1.2 + Math.min(count, 5) * 0.4}rem`,
                margin: "10px",
                fontWeight: "900",
                color: theme.colors.primary,
                display: "inline-block",
                animation: "pulse 1.5s infinite ease-in-out",
              }}>
              {text}
            </span>
          ))}
        </div>
      );
    }

    /* ───────── SCALE ───────── */
    if (type === "scale") {
      const scaleMin = q.settings?.scaleMin ?? 1;
      const scaleMax = q.settings?.scaleMax ?? 5;
      const labels = [];
      const data = [];

      for (let i = scaleMin; i <= scaleMax; i++) {
        labels.push(String(i));
        const count = responses.filter(r => String(r.label) === String(i)).length;
        data.push(count);
      }

      return (
        <Bar options={chartOptions} data={{
            labels,
            datasets: [{
                data,
                backgroundColor: theme.colors.primary,
                borderRadius: 8,
            }]
        }} />
      );
    }

    /* ───────── MULTIPLE CHOICE ───────── */
    if (type === "multiple_choice" || type === "multiple-choice") {
      const labels = options.length > 0 
        ? options.map(o => o.text) 
        : Array.from(new Set(responses.map(r => r.label)));

      const data = labels.map((label, idx) => {
        return responses.filter(r => 
          String(r.optionId) === String(options[idx]?.id) || 
          String(r.label) === String(label) ||
          String(r.label) === String(idx + 1)
        ).length;
      });

      return (
        <Bar options={chartOptions} data={{
            labels,
            datasets: [{
                data,
                backgroundColor: [
                  theme.colors.primary,
                  theme.colors.success,
                  theme.colors.warning,
                  theme.colors.info,
                ],
                borderRadius: 8,
            }]
        }} />
      );
    }

    return <p style={styles.noData}>Tipo não suportado: {type}</p>;
  };

  if (!stats?.poll) return (
    <div style={styles.container}>
      <p style={styles.loading}>A carregar… (stats: {stats ? "OK" : "vazio"})</p>
    </div>
  );
if (isFinished) {
    return (
      <div style={{...styles.container, justifyContent: 'center', alignItems: 'center'}}>
        <div style={styles.finishCard}>
          <span style={{ fontSize: "5rem", display: 'block', marginBottom: '20px' }}>🏁</span>
          <h1 style={styles.prompt}>Sessão Terminada</h1>
          <p style={styles.stat}>Obrigado a todos pela participação!</p>
          <div style={{marginTop: '30px', color: theme.colors.text.tertiary, fontWeight: 'bold'}}>
             👥 Participantes totais: {participantCount}
          </div>
          <button 
            style={{...styles.button, marginTop: '40px'}} 
            onClick={() => window.location.href = '/home'}
          >
            VOLTAR AO PAINEL
          </button>
        </div>
      </div>
    );
  }
  const currentQ = stats.questions?.[stats.currentIdx || 0];
  console.log("🎯 [HOST] CurrentQ:", currentQ);
  console.log("🎯 [HOST] Estrutura stats:", JSON.stringify({ 
    poll: stats.poll?.title,
    questionsCount: stats.questions?.length,
    currentIdx: stats.currentIdx,
    currentQ: currentQ?.type,
    responsesCount: currentQ?.responses?.length
  }, null, 2));

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3) !important;
        }
      `}</style>

      <header style={styles.header}>
        <h2 style={styles.pollTitle}>{stats.poll.title}</h2>
        <div style={styles.statsRow}>
          <p style={styles.stat}>👥 {participantCount} participantes</p>
          <p style={styles.stat}>📊 {stats.questions?.[stats.currentIdx || 0]?.responses?.length || 0} respostas</p>
        </div>
      </header>

      <div style={styles.mainContent}>
        <h1 style={styles.prompt}>{currentQ?.prompt || "Carregando pergunta..."}</h1>

        <div style={styles.chartContainer}>
          {currentQ ? renderChart(currentQ) : <p style={styles.noData}>Sem pergunta selecionada</p>}
        </div>
      </div>

      <div style={styles.footer}>
        <button
          style={styles.button}
          onClick={() =>
            socketRef.current.emit("nextStep", { pollId: Number(pollId) })
          }
        >
          {view === "question" ? "⏭️ PRÓXIMA" : "⏭️ PRÓXIMA"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: theme.colors.bg.primary,
    color: theme.colors.text.primary,
    height: "100vh",
    padding: "0",
    margin: "0",
    display: "flex",
    flexDirection: "column",
    fontFamily: "inherit",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  header: {
    textAlign: "center",
    marginBottom: "8px",
    animation: "fadeIn 0.6s ease-out",
    padding: "8px",
  },
  pollTitle: {
    fontSize: "1.5rem",
    fontWeight: "900",
    margin: "0 0 4px 0",
    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #818cf8 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing.xxl,
    flexWrap: "wrap",
  },
  stat: {
    fontSize: "0.9rem",
    color: theme.colors.text.secondary,
    margin: 0,
    fontWeight: "600",
  },
  participantCount: {
    fontSize: "1.1rem",
    color: theme.colors.text.secondary,
    margin: 0,
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    marginBottom: "4px",
    padding: "0 8px",
  },
  prompt: {
    fontSize: "1.2rem",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "6px",
    lineHeight: "1.2",
    color: theme.colors.text.primary,
  },
  chartContainer: {
    height: "280px",
    width: "100%",
    maxWidth: "100%",
    margin: "0",
    padding: "6px",
    background: theme.colors.bg.secondary,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.lg,
  },
  wordCloudContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  noData: {
    color: theme.colors.text.tertiary,
    textAlign: "center",
    fontSize: "1.1rem",
    margin: 0,
  },
  loading: {
    color: theme.colors.primary,
    textAlign: "center",
    fontSize: "1.3rem",
    padding: theme.spacing.xxxl,
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing.xl,
    padding: "8px",
  },
  button: {
    background: theme.colors.primary,
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: theme.radius.lg,
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "0.95rem",
    transition: `all ${theme.transitions.normal}`,
    boxShadow: theme.shadows.primary,
    minWidth: "160px",
  }
};
