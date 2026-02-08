import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';

export default function RespondPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  // Função para normalizar os tipos vindos da BD
  function normalizeType(type) {
    if (!type) return "";
    return type.toLowerCase().trim().replace(/[\s-]+/g, "_");
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/polls/${id}`)
      .then(res => res.json())
      .then(data => {
        setPoll(data.poll);
        const qs = (data.questions || []).map(q => {
          let parsedSettings = {};
          try {
            // Garante que settings é um objeto, quer venha como string JSON ou objeto
            parsedSettings = typeof q.settings === 'string' ? JSON.parse(q.settings) : (q.settings || {});
          } catch (e) { 
            parsedSettings = {}; 
          }

          return {
            ...q,
            normalizedType: normalizeType(q.type),
            settings: parsedSettings,
            options: q.options || []
          };
        });
        setQuestions(qs);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar sondagem:", err);
        setLoading(false);
      });
  }, [id, API_BASE]);

  const handleAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    for (const qId in answers) {
      const question = questions.find(q => q.id === parseInt(qId));
      const answerValue = answers[qId];

      const payload = {
        pollId: parseInt(id),
        questionId: parseInt(qId),
        optionId: null,
        value: null
      };

      if (question.normalizedType === 'multiple_choice') {
        const selectedOpt = question.options.find(o => o.text === answerValue);
        if (selectedOpt) payload.optionId = selectedOpt.id;
      } else {
        payload.value = answerValue.toString();
      }

      // CORREÇÃO AQUI: Adicionámos "const res =" antes do fetch
      const res = await fetch(`${API_BASE}/api/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Erro ao enviar resposta da pergunta ${qId}`);
      }
      
      console.log(`🚀 Resposta da pergunta ${qId} enviada!`);
    }

    setModal({
      show: true,
      title: "Sucesso",
      message: "Respostas submetidas com sucesso!",
      type: "success",
      onConfirm: () => navigate(`/poll/${id}/stats`)
    });
  } catch (err) {
    console.error("Erro ao submeter:", err);
    setModal({
      show: true,
      title: "Erro",
      message: "Ocorreu um erro ao guardar as tuas respostas.",
      type: "error",
      onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return <div style={msgStyle}>A carregar sondagem...</div>;
  if (!poll) return <div style={msgStyle}>Sondagem não encontrada.</div>;

  return (
    <div style={wrapperStyle}>
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
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{poll.title}</h1>
          <p style={{ color: '#888' }}>{poll.description}</p>
        </header>

        <form onSubmit={handleSubmit}>
          {questions.map((q, idx) => {
            const type = q.normalizedType;
            const currentAnswer = answers[q.id] || "";
            const imageUrl = q.settings?.imageUrl;
            return (
              <div key={q.id} style={cardStyle}>
           {/* Bloco de Imagem Dinâmico */}
   
    <h3 style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <span style={{ color: '#6366f1' }}>{idx + 1}.</span>
      {/* Se for image_text, usamos o content, caso contrário o prompt normal */}
      {type === 'image_text' ? (q.settings?.content || q.prompt) : q.prompt}
    </h3>

                {/* --- ESCOLHA MÚLTIPLA --- */}
                {type === 'multiple_choice' && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {q.options.map(opt => (
                      <label key={opt.id} style={{
                        ...optionLabelStyle,
                        backgroundColor: currentAnswer === opt.text ? "#1e1b4b" : "#0a0a0a",
                        borderColor: currentAnswer === opt.text ? "#6366f1" : "#222"
                      }}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.text}
                          checked={currentAnswer === opt.text}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          style={{ marginRight: '15px', accentColor: '#6366f1' }}
                        />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                )}

                {/* --- TEXTO ABERTO OU NUVEM DE PALAVRAS --- */}
                {(type === 'open_ended' || type === 'word_cloud') && (
                  <input
                    type="text"
                    placeholder="Escreve aqui a tua resposta..."
                    style={inputStyle}
                    value={currentAnswer}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                  />
                )}

                {/* --- ESCALA (CORRIGIDA) --- */}
                {type === 'scale' && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "15px", flexWrap: "wrap" }}>
                      {Array.from({ length: q.settings?.scaleMax || 5 }, (_, i) => i + 1).map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleAnswer(q.id, n.toString())}
                          style={{
                            width: "45px", height: "45px", borderRadius: "50%",
                            border: "2px solid", cursor: "pointer", fontWeight: "bold",
                            transition: "all 0.2s",
                            background: currentAnswer === n.toString() ? "#6366f1" : "#050505",
                            color: "white",
                            borderColor: currentAnswer === n.toString() ? "#6366f1" : "#333"
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.85rem", padding: "0 10px" }}>
                      <span>{q.settings?.labels?.min || "Min"}</span>
                      <span>{q.settings?.labels?.max || "Max"}</span>
                    </div>
                  </div>
                )}

                {/* --- IMAGEM E TEXTO (APENAS EXIBIÇÃO) --- */}
                {type === 'image_text' && (
                  <div style={{ textAlign: "center" }}>
                    {q.settings?.imageUrl && (
                      <img 
                        src={q.settings.imageUrl} 
                        alt="Conteúdo" 
                        style={{ maxWidth: "100%", borderRadius: "12px", marginBottom: "15px" }} 
                      />
                    )}
                   <p style={{ color: '#555', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                       Elemento informativo
                   </p>
                  </div>
                )}
              </div>
            );
          })}

          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? "A ENVIAR..." : "SUBMETER RESPOSTAS"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Estilos
const wrapperStyle = { backgroundColor: "#050505", minHeight: "100vh", padding: "40px 20px", color: "white", fontFamily: "sans-serif" };
const containerStyle = { maxWidth: 700, margin: "0 auto" };
const headerStyle = { textAlign: "center", marginBottom: 40 };
const msgStyle = { backgroundColor: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" };
const cardStyle = { background: "#111", padding: "30px", borderRadius: "20px", marginBottom: "25px", border: "1px solid #222" };
const inputStyle = { width: "100%", padding: "15px", background: "#050505", border: "1px solid #333", color: "white", borderRadius: "10px", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const optionLabelStyle = { display: "flex", alignItems: "center", padding: "15px 20px", borderRadius: "12px", cursor: "pointer", border: "1px solid #222", transition: "all 0.2s ease" };
const submitBtnStyle = { width: "100%", padding: "20px", background: "#6366f1", color: "white", border: "none", borderRadius: "15px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", marginTop: "20px", boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" };
