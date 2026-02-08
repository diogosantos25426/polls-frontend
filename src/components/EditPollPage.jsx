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
  const [access, setAccess] = useState("public");
  const [accessCode, setAccessCode] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null });

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
    dragHandle: { cursor: "grab", color: "#666", fontSize: "1.2rem", marginBottom: "10px", display: "inline-block" },
    imagePreview: { width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "8px", marginTop: "10px", background: "#000" }
  };

  useEffect(() => {
    async function fetchPollData() {
      try {
        const res = await authFetch(`${API_BASE}/api/polls/${id}`);
        const data = await res.json();
        const p = data.poll;
        
        setTitle(p.title);
        setDescription(p.description || "");
        setAccess(p.access || "public");
        setAccessCode(p.access_code || "");
        
        const formattedQuestions = data.questions.map(q => ({
          id: q.id ? `q-${q.id}` : `q-${Math.random()}`,
          prompt: q.prompt,
          type: q.type, // image_text, multiple-choice, scale, word_cloud, open-ended
          options: q.options ? q.options.map(o => typeof o === 'string' ? o : o.text) : ["", ""],
          imageUrl: q.image_url || "", 
          config: q.settings || { maxWords: 1 }
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setQuestions(items);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: `q-${Date.now()}`, prompt: "", type: "multiple-choice", options: ["", ""], imageUrl: "", config: {} }]);
  };

  const updateQuestion = (index, field, value) => {
    const copy = [...questions];
    copy[index][field] = value;
    setQuestions(copy);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // 1. Atualizar Sondagem
      await authFetch(`${API_BASE}/api/polls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, access, access_code: accessCode })
      });

      // 2. Sincronizar Perguntas
      const questionsToSync = questions.map((q, idx) => ({
        ...q,
        position: idx,
        image_url: q.imageUrl,
        settings: q.config || {}
      }));

      await authFetch(`${API_BASE}/api/polls/${id}/questions/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsToSync })
      });

      setModal({ show: true, title: "Sucesso", message: "Configurações guardadas!", type: "success", onConfirm: () => navigate(`/poll/${id}`) });
    } catch (err) {
      setModal({ show: true, title: "Erro", message: "Erro ao guardar alterações.", type: "error" });
    }
  };

  if (loading) return <div style={styles.container}>A carregar...</div>;

  return (
    <div style={styles.container}>
      <Modal show={modal.show} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} confirmText="OK" />
      
      <h1>Editar Sondagem</h1>
      <form onSubmit={handleSave}>
        <label>Título</label>
        <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label>Acesso</label>
            <select style={styles.input} value={access} onChange={e => setAccess(e.target.value)}>
              <option value="public">Público</option>
              <option value="code">Código Privado</option>
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

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {questions.map((q, qIdx) => (
                  <Draggable key={q.id} draggableId={q.id} index={qIdx}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} style={{ ...styles.card, ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}>
                        
                        <div {...provided.dragHandleProps} style={styles.dragHandle}>⠿ Arrastar para reordenar</div>

                        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                          <input 
                            style={{ ...styles.input, flex: 3, margin: 0 }} 
                            value={q.prompt} 
                            onChange={e => updateQuestion(qIdx, "prompt", e.target.value)} 
                            placeholder="Escreva a pergunta..."
                          />
                          <select 
                            style={{ ...styles.input, flex: 1, margin: 0 }} 
                            value={q.type} 
                            onChange={e => updateQuestion(qIdx, "type", e.target.value)}
                          >
                            <option value="multiple-choice">Múltipla Escolha</option>
                            <option value="image_text">Texto com Imagem</option>
                            <option value="scale">Escala (Likert)</option>
                            <option value="word_cloud">Nuvem de Palavras</option>
                            <option value="open-ended">Resposta Aberta</option>
                          </select>
                        </div>

                        {/* EDITAR IMAGEM (Apenas se o tipo for image_text) */}
                        {q.type === "image_text" && (
                          <div style={{ marginBottom: "20px", padding: "15px", background: "#222", borderRadius: "10px" }}>
                            <label style={{ fontSize: "0.8rem", color: "#888" }}>URL DA IMAGEM</label>
                            <input 
                              style={{ ...styles.input, marginBottom: "10px" }} 
                              value={q.imageUrl || ""} 
                              onChange={e => updateQuestion(qIdx, "imageUrl", e.target.value)} 
                              placeholder="https://exemplo.com/imagem.png"
                            />
                            {q.imageUrl && <img src={q.imageUrl} alt="Preview" style={styles.imagePreview} />}
                          </div>
                        )}

                        {/* OPÇÕES (Apenas para Múltipla Escolha) */}
                        {q.type === "multiple-choice" && (
                          <div style={{ paddingLeft: "20px", borderLeft: "2px solid #333" }}>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} style={styles.optionRow}>
                                <input 
                                  style={{ ...styles.input, margin: 0 }} 
                                  value={opt} 
                                  onChange={e => {
                                    const newOpts = [...q.options];
                                    newOpts[oIdx] = e.target.value;
                                    updateQuestion(qIdx, "options", newOpts);
                                  }}
                                  placeholder={`Opção ${oIdx + 1}`}
                                />
                                <button type="button" onClick={() => {
                                  const newOpts = q.options.filter((_, i) => i !== oIdx);
                                  updateQuestion(qIdx, "options", newOpts);
                                }} style={{ ...styles.removeBtn, padding: "0 10px" }}>×</button>
                              </div>
                            ))}
                            <button type="button" onClick={() => updateQuestion(qIdx, "options", [...q.options, ""])} style={{ ...styles.buttonPrimary, fontSize: "0.8rem", background: "#333" }}>+ Adicionar Opção</button>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
                          <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))} style={styles.removeBtn}>Remover Pergunta</button>
                        </div>
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
        <button type="submit" style={styles.buttonSave}>GUARDAR ALTERAÇÕES</button>
      </form>
    </div>
  );
}
