import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthFetch } from "./useAuthFetch";
import { Modal } from "./ui/Modal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function EditPollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("individual");
  const [access, setAccess] = useState("public");
  const [accessCode, setAccessCode] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const styles = {
    container: { maxWidth: "900px", margin: "40px auto", padding: "40px", backgroundColor: "#111", borderRadius: "20px", color: "white", fontFamily: "sans-serif" },
    input: { width: "100%", padding: "12px", margin: "10px 0 20px 0", backgroundColor: "#222", border: "1px solid #333", borderRadius: "8px", color: "white", fontSize: "1rem" },
    card: { background: "#1a1a1a", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #333", position: "relative" },
    buttonPrimary: { background: "#6366f1", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    buttonSecondary: { background: "#444", color: "white", padding: "8px 15px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", marginRight: "10px" },
    buttonSave: { background: "#10b981", color: "white", padding: "15px 30px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "100%", marginTop: "20px" },
    removeBtn: { background: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer", height: "40px" },
    optionRow: { display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" },
    dragHandle: { cursor: "grab", color: "#666", fontSize: "1.2rem", marginBottom: "10px", display: "inline-block" }
  };

  useEffect(() => {
    async function fetchPollData() {
      try {
        const res = await authFetch(`${API_BASE}/polls/${id}`);
        const data = await res.json();
        const p = data.poll;
        setTitle(p.title);
        setDescription(p.description || "");
        setMode(p.mode);
        setAccess(p.access);
        setAccessCode(p.accessCode || "");
        
        const formattedQuestions = data.questions.map(q => ({
          id: `q-${Math.random()}`, // Precisamos de IDs únicos e estáveis para o Drag and Drop
          prompt: q.prompt,
          type: q.type,
          options: q.options ? q.options.map(o => o.text) : ["", ""],
          config: q.config || { maxWords: 1 }
        }));
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error("Erro ao carregar poll:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPollData();
  }, [id]);

  // --- Lógica de Reordenação ---
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  // --- Lógica de Manipulação ---
  const addQuestion = () => {
    setQuestions([...questions, { id: `q-${Date.now()}`, prompt: "", type: "multiple", options: ["", ""], config: { maxWords: 1 } }]);
  };

  const duplicateQuestion = (index) => {
    const qToCopy = questions[index];
    const duplicated = { 
      ...qToCopy, 
      id: `q-${Date.now()}`, // Novo ID para a cópia
      prompt: `${qToCopy.prompt} (Cópia)`,
      options: [...qToCopy.options]
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicated);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const copy = [...questions];
    copy[index][field] = value;
    setQuestions(copy);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex) => {
    const copy = [...questions];
    copy[qIndex].options.push("");
    setQuestions(copy);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const copy = [...questions];
    copy[qIndex].options[oIndex] = value;
    setQuestions(copy);
  };

  const removeOption = (qIndex, oIndex) => {
    const copy = [...questions];
    copy[qIndex].options = copy[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(copy);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await authFetch(`${API_BASE}/polls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, mode, access, accessCode })
      });

      await authFetch(`${API_BASE}/polls/${id}/questions/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions })
      });

      setModal({
        show: true,
        title: "Sucesso",
        message: "Alterações guardadas!",
        type: "success",
        onConfirm: () => navigate(`/polls/${id}/stats`)
      });
    } catch (err) {
      setModal({
        show: true,
        title: "Erro",
        message: "Erro ao guardar.",
        type: "error",
        onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
      });
    }
  };

  if (loading) return <div style={styles.container}>Carregando...</div>;

  return (
    <div style={styles.container}>
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
      <h1>Editar Sondagem</h1>
      <form onSubmit={handleSave}>
        <label>Título</label>
        <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label>Acesso</label>
            <select style={styles.input} value={access} onChange={e => setAccess(e.target.value)}>
              <option value="public">Público</option>
              <option value="code">Código</option>
            </select>
          </div>
          {access === "code" && (
            <div>
              <label>Código de Acesso</label>
              <input style={styles.input} value={accessCode} onChange={e => setAccessCode(e.target.value)} required />
            </div>
          )}
        </div>

        <hr style={{ borderColor: "#222", margin: "30px 0" }} />

        {/* ÁREA DE ARRASTAR */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {questions.map((q, qIdx) => (
                  <Draggable key={q.id} draggableId={q.id} index={qIdx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...styles.card,
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          border: snapshot.isDragging ? "1px solid #6366f1" : "1px solid #333"
                        }}
                      >
                        {/* Pega aqui para arrastar */}
                        <div {...provided.dragHandleProps} style={styles.dragHandle}>
                          ⠿ Arrastar para reordenar
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                          <input 
                            style={{ ...styles.input, flex: 3, margin: 0 }} 
                            value={q.prompt} 
                            onChange={e => updateQuestion(qIdx, "prompt", e.target.value)} 
                            placeholder="Pergunta..."
                          />
                          <select 
                            style={{ ...styles.input, flex: 1, margin: 0 }} 
                            value={q.type} 
                            onChange={e => updateQuestion(qIdx, "type", e.target.value)}
                          >
                            <option value="multiple">Múltipla</option>
                            <option value="wordcloud">Nuvem</option>
                            <option value="likert">Escala</option>
                            <option value="boolean">V/F</option>
                          </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
                          <button type="button" onClick={() => duplicateQuestion(qIdx)} style={styles.buttonSecondary}>Duplicar</button>
                          <button type="button" onClick={() => removeQuestion(qIdx)} style={styles.removeBtn}>Remover Pergunta</button>
                        </div>

                        {["multiple", "ranking"].includes(q.type) && (
                          <div style={{ paddingLeft: "20px", borderLeft: "2px solid #333" }}>
                            <label style={{ fontSize: "0.8rem", color: "#666" }}>OPÇÕES</label>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} style={styles.optionRow}>
                                <input 
                                  style={{ ...styles.input, margin: 0 }} 
                                  value={opt} 
                                  onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                  placeholder={`Opção ${oIdx + 1}`}
                                />
                                {q.options.length > 1 && (
                                  <button type="button" onClick={() => removeOption(qIdx, oIdx)} style={{ ...styles.removeBtn, padding: "0 10px" }}>×</button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => addOption(qIdx)} style={{ ...styles.buttonPrimary, fontSize: "0.8rem", background: "#333" }}>+ Adicionar Opção</button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button type="button" onClick={addQuestion} style={{ ...styles.buttonPrimary, width: "100%", padding: "15px", marginTop: "10px" }}>+ Nova Pergunta</button>
        <button type="submit" style={styles.buttonSave}>GUARDAR TUDO</button>
      </form>
    </div>
  );
}
