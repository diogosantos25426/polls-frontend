import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Modal } from './ui/Modal';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf'; // Importado para o PDF
import autoTable from 'jspdf-autotable'; // Auxiliar para tabelas no PDF

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function PollView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [isExporting, setIsExporting] = useState(false);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
  const [totalResponses, setTotalResponses] = useState(0);
  const socketRef = useRef(null);
  const chartRefs = useRef({});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  // --- FUNÇÃO EXPORTAR CSV ---
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Pergunta,Resposta,Valor/Votos\n";
    questions.forEach(q => {
      const resps = q.responses || q.answers || [];
      if (q.options && q.options.length > 0) {
        q.options.forEach(opt => {
          csvContent += `"${q.prompt}","${opt.text}",${opt.votes || 0}\n`;
        });
      } else {
        resps.forEach(r => {
          const val = r.value || r.text || r;
          csvContent += `"${q.prompt}","Resposta Aberta","${String(val).replace(/"/g, '""')}"\n`;
        });
      }
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resultados_sondagem_${id}.csv`);
    link.click();
  };

  // --- FUNÇÃO EXPORTAR PDF ---
  const exportPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2; // Limite de largura para o texto

  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text(poll?.title || "Relatório de Sondagem", margin, 20);
  
  let currentY = 40;

  questions.forEach((q, i) => {
    // 1. Verificar se é tipo 'image_text' - saltamos a lógica de dados para estas
    const isPresentationOnly = q.normalizedType === 'image_text';
    
    // Verificação de quebra de página
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    
    // Configuração da Pergunta
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    
    // Quebrar o texto do prompt se for muito longo para a linha
    const promptLines = doc.splitTextToSize(`${i + 1}. ${q.prompt}`, maxLineWidth);
    doc.text(promptLines, margin, currentY);
    currentY += (promptLines.length * 7); // Ajusta o Y com base no número de linhas

    // Se for apenas imagem/texto decorativo, não gera gráfico nem tabela de respostas
    if (isPresentationOnly) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("(Slide de apresentação - Sem respostas)", margin, currentY);
      currentY += 15;
      return; // Salta para a próxima pergunta
    }

    // 2. Lógica de Gráficos e Tabelas para perguntas com dados
    if (chartRefs.current[q.id]) {
      try {
        const chartImg = chartRefs.current[q.id].toBase64Image();
        doc.addImage(chartImg, 'PNG', margin, currentY, 160, 80);
        currentY += 95;
      } catch (e) {
        console.error("Erro ao converter gráfico:", e);
        currentY += 10;
      }
    } else {
      const resps = (q.responses || q.answers || []).map(r => {
        const val = r.value || r.text || r;
        // Limita o conteúdo da célula para não quebrar o layout da tabela
        return [val.toString()];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Respostas']],
        body: resps.length > 0 ? resps : [['Sem respostas']],
        theme: 'striped',
        styles: { overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: { 0: { cellWidth: maxLineWidth } },
        didDrawPage: (data) => { currentY = data.cursor.y + 15; }
      });
      
      // Atualiza o Y caso a tabela não tenha disparado o didDrawPage (tabelas curtas)
      if (doc.lastAutoTable.finalY) {
        currentY = doc.lastAutoTable.finalY + 15;
      }
    }
  });

  doc.save(`relatorio_${id}.pdf`);
};
const performExportToMeeting = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/meetings/export`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ pollId: id })
      });
      const data = await res.json();
      if (res.ok && data.meetingId) {
        setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
        navigate("/meeting-mode");
      } else {
        setModal({
          show: true,
          title: "Erro",
          message: data.error || "Erro ao exportar para reunião",
          type: "error",
          onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
        });
      }
    } catch (err) { 
      setModal({
        show: true,
        title: "Erro",
        message: "Erro de conexão: " + err.message,
        type: "error",
        onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
      });
    } 
    finally { setIsExporting(false); }
  };

  const handleExportToMeeting = () => {
    setModal({
      show: true,
      title: "Exportar para Reunião",
      message: "Isto criará uma versão 'limpa' da sondagem para apresentação (Modo Reunião). Continuar?",
      type: "info",
      onConfirm: () => {
        setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });
        performExportToMeeting();
      },
      onCancel: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  };
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        display: chartType === 'pie',
        position: 'bottom',
        labels: { color: '#888', padding: 20 }
      }
    },
    scales: chartType === 'bar' ? {
      y: { beginAtZero: true, grid: { color: '#222' }, ticks: { color: '#888' } },
      x: { grid: { display: false }, ticks: { color: '#888' } }
    } : {}
  };

  const styles = {
  wrapper: { 
    backgroundColor: "#050505", 
    minHeight: "100vh", 
    width: "100%",
    // Padding lateral reduzido no mobile via clamp
    padding: "40px clamp(10px, 4vw, 20px)", 
    color: "white", 
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  container: { 
    width: "100%", 
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column"
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "30px", 
    gap: "15px",
    flexWrap: "wrap", // Crucial para os botões não esticarem o ecrã
    width: "100%"
  },
  mainGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
    gap: "30px" 
  },
header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "30px", 
    gap: "15px",
    flexWrap: "wrap", // Crucial para os botões não esticarem o ecrã
    width: "100%"
  },    infoBlock: { padding: "20px", borderLeft: "4px solid #6366f1", background: "linear-gradient(90deg, #0a0a0a, transparent)", marginBottom: "30px" },
    btnPrimary: { background: "#4338ca", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", border: "none", cursor: "pointer", width: '100%', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    btnSuccess: { background: "#4338ca", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", border: "none", cursor: "pointer", marginBottom: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    btnExport: { background: "#4338ca", color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", opacity: isExporting ? 0.7 : 1,marginBottom: '10px' },
    openResponseItem: { background: "#1a1a1a", padding: "10px 20px", borderRadius: "25px", border: "1px solid #333", color: "#eee", display: "inline-block", margin: "5px", fontSize: "0.9rem" },
    wordCloudBubble: { display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #4338ca)", color: "white", textAlign: "center", fontWeight: "bold", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" },
    scaleOption: { flex: 1, textAlign: 'center', padding: '15px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' },
    // Dentro do objeto styles
btnEdit: { 
  background: "#4338ca", // Cor âmbar/laranja
  color: "white", 
  padding: "12px 24px", 
  borderRadius: "8px", 
  textDecoration: "none", 
  fontWeight: "bold", 
  border: "none", 
  cursor: "pointer", 
  marginBottom: '10px', 
  display: 'inline-flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  textAlign: 'center' 
},
    // Dentro do objeto styles...
openEndedCard: {
  background: "#1a1a1a",
  padding: "15px 20px",
  borderRadius: "12px",
  border: "1px solid #333",
  marginBottom: "10px",
  lineHeight: "1.5",
  color: "#eee",
  fontSize: "0.95rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  transition: "transform 0.2s",
},
openEndedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
    gap: "15px",
    marginTop: "20px",
    width: "100%"
  }
  };

  const normalizeType = (type) => type?.toLowerCase().replace(/[\s-]+/g, '_') || '';

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/polls/${id}/stats`);
      const data = await res.json();
      setPoll(data.poll);
const qs = (data.questions || []).map(q => ({ ...q, normalizedType: normalizeType(q.type) }));
    setQuestions(qs);

    // Calcula e guarda o total aqui
    const total = qs.reduce((acc, q) => acc + (q.responses?.length || 0), 0);
    setTotalResponses(total);
  } catch (err) { setError("Erro ao carregar dados."); } 
  finally { setLoading(false); }
};

  useEffect(() => {
    loadStats();
    socketRef.current = io(API_BASE);
    socketRef.current.on('connect', () => socketRef.current.emit('joinPoll', { pollId: Number(id), name: 'VIEWER' }));
    const refreshData = () => loadStats();
    socketRef.current.on('answerSubmitted', refreshData);
    return () => socketRef.current?.disconnect();
  }, [id]);

  const getChartData = (q) => {
    const responses = q.responses || q.answers || [];
    const options = q.options || [];
    const labels = options.map(o => o.text);
    const dataValues = options.map(opt => {
      if (typeof opt.votes !== 'undefined' && opt.votes !== null) return opt.votes;
      return responses.filter(r => String(r.optionId || r.option_id) === String(opt.id) || r.value === opt.text).length;
    });

    if (labels.length === 0 && responses.length > 0) {
      const counts = {};
      responses.forEach(r => { 
        const val = r.value || "Sem resposta"; 
        counts[val] = (counts[val] || 0) + 1; 
      });
      return {
        labels: Object.keys(counts),
        datasets: [{ data: Object.values(counts), backgroundColor: '#6366f1', borderRadius: 8 }]
      };
    }

    return {
      labels,
      datasets: [{
        data: dataValues,
        backgroundColor: chartType === 'bar' ? '#6366f1' : ['#6366f1','#10b981','#f59e0b','#ef4444','#a855f7'],
        borderRadius: chartType === 'bar' ? 8 : 0
      }]
    };
  };

  const processWords = (responses) => {
    const map = {};
    responses.forEach(r => {
      const word = (r.value || r.text || r).toString().trim();
      if (word) map[word] = (map[word] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  if (loading) return <div style={styles.wrapper}>A carregar...</div>;

  return (
    <div style={styles.wrapper}>
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
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={{ margin: 0 }}>{poll?.title}</h1>
            
          </div>
<div
  style={{
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    width: window.innerWidth < 768 ? '100%' : 'auto'
  }}
>
            <button onClick={handleExportToMeeting} style={{ ...styles.btnExport, width: window.innerWidth < 768 ? '100%' : 'auto' }} disabled={isExporting}>
              {isExporting ? "A EXPORTAR..." : "📺Exportar Reunião"}
            </button>
            <Link to={`/polls/edit/${id}`} style={styles.btnEdit}>
      ✏️ EDITAR
    </Link>
            <Link to={`/respond/${id}`} style={styles.btnSuccess}>RESPONDER</Link>
            <Link to="/polls" style={{ ...styles.btnPrimary, background: "#222", width: 'auto' }}>VOLTAR</Link>
          </div>
        </header>

       < div style={{  display: 'grid', gridTemplateColumns:window.innerWidth < 900 ? '1fr' : '1fr 300px',   gap: '30px'}}>
          <main>
            {questions.map((q, idx) => {
              const responses = q.responses || q.answers || [];
              const type = q.normalizedType;

              if (type === 'image_text') {
                return (
                  <div key={q.id} style={styles.infoBlock}>
                    <h3 style={{ margin: 0, color: '#6366f1', lineHeight: '1.4' }}>{q.prompt}</h3>
                  </div>
                );
              }

              if (type === 'scale') {
                const values = responses.map(r => Number(r.value)).filter(v => !isNaN(v));
                const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "0.0";
                const maxScale = q.settings?.scaleMax || 5;
                const minLabel = q.settings?.labels?.min || "Min";
                const maxLabel = q.settings?.labels?.max || "Max";
                const scaleRange = Array.from({ length: maxScale }, (_, i) => i + 1);
                const distribution = scaleRange.map(val => ({ val, count: responses.filter(r => Number(r.value) === val).length }));

                return (
                  <div key={q.id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3>{idx + 1}. {q.prompt}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginTop: '30px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <div style={{ fontSize: '4rem', color: '#6366f1', fontWeight: 'bold', lineHeight: 1 }}>{avg}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '1px', marginTop: '10px' }}>MÉDIA</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        {distribution.map(item => (
                          <div key={item.val} style={styles.scaleOption}>
                            <div style={{ color: '#67676b', fontWeight: 'bold' }}>{item.count}</div>
                            <div style={{ borderTop: '1px solid #333', marginTop: '5px' }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (type === 'word_cloud') {
                const words = processWords(responses);
                return (
                  <div key={q.id} style={styles.card}>
                    <h3>{idx + 1}. {q.prompt}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', minHeight: '200px', alignItems: 'center' }}>
                      {words.map(([word, count], i) => (
                        <div key={i} className="bubble" style={{ ...styles.wordCloudBubble, width: 60+(count*15), height: 60+(count*15) }}>{word}</div>
                      ))}
                    </div>
                  </div>
                );
              }
              if (type === 'open_ended') {
  return (
    <div key={q.id} style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{idx + 1}. {q.prompt}</h3>
      </div>
      
      {responses.length === 0 ? (
        <p style={{ color: '#555', marginTop: '20px' }}>Aguardando respostas...</p>
      ) : (
        <div style={styles.openEndedGrid}>
          {responses.map((r, i) => (
            <div key={i} style={styles.openEndedCard} className="open-card">
              {r.value || r.text || r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

              return (
                <div key={q.id} style={styles.card}>
                  <h3>{idx + 1}. {q.prompt}</h3>
<div
  style={{
    height: window.innerWidth < 768 ? '220px' : '300px',
    width: '100%'
  }}
>                    <Bar ref={ref => chartRefs.current[q.id] = ref} data={getChartData(q)} options={commonOptions} />
                  </div>
                </div>
              );
            })}
            
          </main>

          <aside>
            <div style={styles.card}>
              <h4 style={{ margin: "0 0 10px 0", color: '#888' }}>EXPORTAR DADOS</h4>
              
              <button onClick={exportPDF} style={styles.btnPrimary}>
                📄 EXPORTAR PDF
              </button>
              
              <button onClick={exportCSV} style={{ ...styles.btnPrimary,  }}>
                📊 EXPORTAR CSV
              </button>

             
            </div>
            
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <p style={{ color: '#555', fontSize: '0.8rem' }}>RESPOSTAS</p>
              <h2 style={{ margin: 0, color: '#4338ca', fontSize: '2.5rem' }}>
                {questions.reduce((acc, q) => acc + (q.responses?.length || 0), 0)}
              </h2>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .bubble:hover { transform: scale(1.1); transition: 0.3s; }
      `}</style>
    </div>
  );
}
