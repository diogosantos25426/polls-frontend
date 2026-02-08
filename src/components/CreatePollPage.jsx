import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthFetch } from "./useAuthFetch";
import { Modal } from "./ui/Modal";
import QRCodeLib from "qrcode";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function CreatePollPage() {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();

  // Estados da Sondagem
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState("public");
  const [accessCode, setAccessCode] = useState("");
  const [elements, setElements] = useState([]);
  
  // Estados da IA
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Estados de Sucesso
  const [createdPoll, setCreatedPoll] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });

 const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const styles = {
    container: { maxWidth: "900px", margin: "40px auto", padding: "40px", backgroundColor: "#050505", borderRadius: "20px", color: "white", fontFamily: "sans-serif" },
    input: { width: "100%", padding: "12px", margin: "10px 0 10px 0", backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px", color: "white", fontSize: "1rem" },
    card: { background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #333", position: "relative" },
    aiBox: { background: "linear-gradient(45deg, #1e1b4b, #312e81)", padding: "25px", borderRadius: "16px", marginBottom: "30px", border: "1px solid #4338ca" },
    buttonPrimary: { background: "#6366f1", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
    buttonSuccess: { background: "#4338ca", color: "white", padding: "15px 30px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "100%", marginTop: "20px" },
    removeBtn: { background: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer", height: "40px" },
    dragHandle: { cursor: "grab", color: "#666", fontSize: "1.2rem", marginRight: "10px" },
    toolbar: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", padding: "15px", background: "#111", borderRadius: "12px", border: "1px solid #222" },
    collapseBtn: { background: "none", border: "1px solid #444", color: "#aaa", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "0.8rem" }
  };
const handleFileChange = (idx, file) => {
  if (!file) return;

  // Verifica o tamanho (opcional, ex: 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert("A imagem é muito grande. Escolha uma até 2MB.");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    // reader.result contém a string Base64 da imagem
    updateElement(idx, 'imageUrl', reader.result);
  };
  reader.readAsDataURL(file);
};
  // --- Lógica da IA ---
  const generateWithAI = async () => {
    if (!aiPrompt) return setModal({
      show: true,
      title: "Aviso",
      message: "Escreve primeiro o que queres que a IA crie!",
      type: "warning",
      onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
    setIsGenerating(true);

    try {
      const res = await authFetch(`${API_BASE}/polls/generate-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      if (!res.ok) throw new Error("Erro na resposta do servidor.");
      const parsed = await res.json();

      setTitle(parsed.title || "");
      setDescription(parsed.description || "");
      
      const newElements = parsed.elements.map(el => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        type: el.type || "multiple",
        prompt: el.prompt || "",
        content: el.content || "",
        options: el.options || (el.type === 'multiple' ? ["Opção 1", "Opção 2"] : []),
        scaleMin: el.scaleMin || 1,
        scaleMax: el.scaleMax || 5,
        labels: el.labels || { min: "Discordo", max: "Concordo" },
        isCollapsed: false 
      }));

      setElements(newElements);
    } catch (err) {
      setModal({
        show: true,
        title: "Erro",
        message: "Falha ao gerar com IA.",
        type: "error",
        onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Funções de Manipulação ---
  const addElement = (type) => {
    const newEl = { 
      id: `el-${Date.now()}`, 
      type, 
      prompt: "", 
      options: type === 'multiple' ? ["", ""] : [], 
      content: "",
      scaleMin: 1,
      scaleMax: 5,
      labels: { min: "Fraco", max: "Excelente" },
      isCollapsed: false 
    };
    setElements([...elements, newEl]);
  };

  const toggleCollapse = (idx) => {
    const copy = [...elements];
    copy[idx].isCollapsed = !copy[idx].isCollapsed;
    setElements(copy);
  };

  const updateElement = (index, field, value) => {
    const copy = [...elements];
    copy[index][field] = value;
    setElements(copy);
  };

  const updateLabel = (index, key, value) => {
    const copy = [...elements];
    copy[index].labels = { ...copy[index].labels, [key]: value };
    setElements(copy);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...elements];
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setElements(items);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validações básicas
  if (!title.trim()) return setModal({
    show: true,
    title: "Aviso",
    message: "Por favor, insere um título para a sondagem.",
    type: "warning",
    onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
  });
  if (elements.length === 0) return setModal({
    show: true,
    title: "Aviso",
    message: "Adiciona pelo menos uma pergunta ou elemento.",
    type: "warning",
    onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
  });

  try {
    // 1. CRIAR A SONDAGEM (POLL)
    const pollRes = await authFetch(`${API_BASE}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title, 
        description, 
        access: access || 'public', 
        accessCode: accessCode || null 
      })
    });

    if (!pollRes.ok) {
      const errorData = await pollRes.json();
      throw new Error(errorData.error || "Erro ao criar a sondagem.");
    }

    const poll = await pollRes.json();

    if (!poll || !poll.id) {
      throw new Error("O servidor não devolveu um ID válido.");
    }

    console.log("✅ Sondagem criada. ID:", poll.id);

    // 2. PREPARAR E SINCRONIZAR PERGUNTAS E OPÇÕES
    const formattedQuestions = elements.map((el, index) => {
      let finalType = el.type;
      if (el.type === 'multiple') finalType = 'multiple-choice';
      if (el.type === 'open_text') finalType = 'open-ended';

      return {
        type: finalType,
        position: index,
        prompt: (el.type === 'image_text' || el.type === 'text_block') 
                ? el.content 
                : el.prompt,
        
        options: (el.type === 'multiple' || el.type === 'multiple-choice') 
                 ? el.options.filter(opt => opt && opt.trim() !== "") 
                 : [],
        
        settings: { 
          scaleMin: Number(el.scaleMin) || 1, 
          scaleMax: Number(el.scaleMax) || 5, 
          labels: el.labels || { min: "Fraco", max: "Excelente" },
          imageUrl: el.imageUrl,
          content: el.content || "" 
        }
      };
    });

    const syncRes = await authFetch(`${API_BASE}/polls/${poll.id}/questions/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: formattedQuestions })
    });

    if (!syncRes.ok) {
      const syncError = await syncRes.json();
      throw new Error(syncError.error || "Erro ao guardar perguntas e opções.");
    }

    console.log("✅ Perguntas e opções sincronizadas com sucesso.");

    // 3. GERAR QR CODE E FINALIZAR
    const lobbyUrl = `${window.location.origin}/respond/${poll.id}`;
    const qr = await QRCodeLib.toDataURL(lobbyUrl);
    
    setCreatedPoll(poll);
    setQrDataUrl(qr);

  } catch (err) {
    console.error("❌ Erro no processo de criação:", err);
    setModal({
      show: true,
      title: "Erro",
      message: err.message || "Ocorreu um erro ao publicar a sondagem.",
      type: "error",
      onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
  }
};

  if (createdPoll) return (
    <div style={{...styles.container, textAlign: 'center'}}>
      <h2 style={{color: '#4338ca'}}>Sondagem Publicada!</h2>
      <div style={{background: 'white', padding: '15px', display: 'inline-block', borderRadius: '10px', margin: '20px'}}>
        <img src={qrDataUrl} alt="QR" width="200"/>
      </div>
      <button style={styles.buttonSuccess} onClick={() => navigate(`/poll/${createdPoll.id}`)}>ABRIR PAINEL DE CONTROLO</button>
    </div>
  );

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
    
    {/* --- SEÇÃO IA --- */}
    <div style={styles.aiBox}>
      <h3 style={{ marginTop: 0 }}>✨ Criar com Inteligência Artificial</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          style={{ ...styles.input, margin: 0 }} 
          placeholder="Ex: 5 perguntas sobre café e uma escala de satisfação" 
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
        />
        <button type="button" onClick={generateWithAI} disabled={isGenerating} style={styles.buttonPrimary}>
          {isGenerating ? "A processar..." : "Gerar"}
        </button>
      </div>
    </div>

    <form onSubmit={handleSubmit}>
      {/* --- CABEÇALHO DA SONDAGEM --- */}
      <div style={styles.card}>
        <input 
          style={{ ...styles.input, fontSize: '1.5rem', fontWeight: 'bold' }} 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          placeholder="Título da Sondagem" 
        />
        <input 
          style={styles.input} 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Descrição ou subtítulo (opcional)" 
        />
      </div>

      {/* --- BARRA DE FERRAMENTAS --- */}
      <div style={styles.toolbar}>
        <button type="button" onClick={() => addElement('multiple')} style={styles.buttonPrimary}>+ Escolha Múltipla</button>
        <button type="button" onClick={() => addElement('open_text')} style={styles.buttonPrimary}>+ Texto Aberto</button>
        <button type="button" onClick={() => addElement('scale')} style={styles.buttonPrimary}>+ Escala</button>
        <button type="button" onClick={() => addElement('word_cloud')} style={styles.buttonPrimary}>+ Nuvem de Palavras</button>
        <button type="button" onClick={() => addElement('image_text')} style={{ ...styles.buttonPrimary, background: '#333' }}>+ Imagem/Texto</button>
      </div>

      {/* --- LISTA DINÂMICA (DRAG & DROP) --- */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="elements">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {elements.map((el, idx) => (
                <Draggable key={el.id} draggableId={el.id} index={idx}>
                  {(p, snapshot) => (
                    <div 
                      ref={p.innerRef} 
                      {...p.draggableProps} 
                      style={{ 
                        ...styles.card, 
                        ...p.draggableProps.style, 
                        border: snapshot.isDragging ? '2px solid #6366f1' : '1px solid #333' 
                      }}
                    >
                      {/* HEADER DO ELEMENTO */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: el.isCollapsed ? '0' : '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span {...p.dragHandleProps} style={styles.dragHandle}>⠿</span>
                          <span style={{ color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                            {el.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="button" onClick={() => toggleCollapse(idx)} style={styles.collapseBtn}>
                            {el.isCollapsed ? "Expandir" : "Compactar"}
                          </button>
                          <button type="button" onClick={() => setElements(elements.filter((_, i) => i !== idx))} style={styles.removeBtn}>×</button>
                        </div>
                      </div>

                      {/* CONTEÚDO EXPANDIDO */}
                      {!el.isCollapsed && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          
                          {/* INPUT DE PERGUNTA (Exceto para Blocos de Imagem/Texto) */}
                          {el.type !== 'image_text' && (
                            <input 
                              style={styles.input} 
                              placeholder="Escreve aqui a tua pergunta..." 
                              value={el.prompt} 
                              onChange={e => updateElement(idx, 'prompt', e.target.value)} 
                            />
                          )}

                          {/* TIPO: ESCOLHA MÚLTIPLA */}
                          {el.type === 'multiple' && (
                            <div style={{ paddingLeft: '20px' }}>
                              {el.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                                  <input 
                                    style={{ ...styles.input, margin: 0, padding: '8px' }} 
                                    value={opt} 
                                    onChange={e => {
                                      const o = [...el.options]; o[oIdx] = e.target.value;
                                      updateElement(idx, 'options', o);
                                    }}
                                  />
                                  <button type="button" style={styles.removeBtn} onClick={() => {
                                    const o = el.options.filter((_, i) => i !== oIdx);
                                    updateElement(idx, 'options', o);
                                  }}>×</button>
                                </div>
                              ))}
                              <button type="button" style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => updateElement(idx, 'options', [...el.options, ""])}>
                                + Adicionar Opção
                              </button>
                            </div>
                          )}

                          {/* TIPO: ESCALA */}
                          {el.type === 'scale' && (
                            <div style={{ display: 'flex', gap: '10px', background: '#1a1a1a', padding: '15px', borderRadius: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: '#888' }}>Label Mínima (1)</label>
                                <input style={styles.input} value={el.labels.min} onChange={e => updateLabel(idx, 'min', e.target.value)} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: '#888' }}>Label Máxima ({el.scaleMax})</label>
                                <input style={styles.input} value={el.labels.max} onChange={e => updateLabel(idx, 'max', e.target.value)} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.8rem', color: '#888' }}>Valor Max</label>
                                <select 
                                  style={{ ...styles.input, width: '80px' }} 
                                  value={el.scaleMax} 
                                  onChange={e => updateElement(idx, 'scaleMax', e.target.value)}
                                >
                                  <option value="3">3</option>
                                  <option value="5">5</option>
                                  <option value="10">10</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* TIPO: IMAGEM E TEXTO (NOVO LAYOUT) */}
                          {el.type === 'image_text' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              <div>
                                <label style={{ fontSize: '0.8rem', color: '#888' }}>Título / Texto do Bloco</label>
                                <textarea
                                  style={{ ...styles.input, minHeight: '80px', marginTop: '5px' }}
                                  placeholder="Escreve aqui o texto informativo..."
                                  value={el.content}
                                  onChange={e => updateElement(idx, 'content', e.target.value)}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <label style={{ fontSize: '0.8rem', color: '#888' }}>Origem da Imagem</label>
                                  <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#6366f1', display: 'block' }}>Ficheiro Local:</span>
                                    <input type="file" accept="image/*" onChange={e => handleFileChange(idx, e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                                  </div>
                                  <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#6366f1', display: 'block' }}>Ou URL:</span>
                                    <input 
                                      style={{ ...styles.input, padding: '5px', margin: 0 }} 
                                      placeholder="https://..." 
                                      value={el.imageUrl && !el.imageUrl.startsWith('data:') ? el.imageUrl : ''} 
                                      onChange={e => updateElement(idx, 'imageUrl', e.target.value)} 
                                    />
                                  </div>
                                </div>
                                <div style={{ flex: 1, height: '140px', background: '#000', borderRadius: '8px', border: '2px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                  {el.imageUrl ? (
                                    <>
                                      <img src={el.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Preview" />
                                      <button type="button" onClick={() => updateElement(idx, 'imageUrl', null)} style={{ position: 'absolute', top: 5, right: 5, background: 'red', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '2px 5px', fontSize: '0.6rem' }}>Remover</button>
                                    </>
                                  ) : <span style={{ color: '#444', fontSize: '0.8rem' }}>Sem imagem</span>}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TIPO: TEXTO ABERTO / NUVEM */}
                          {(el.type === 'open_text' || el.type === 'word_cloud') && (
                            <p style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                              {el.type === 'open_text' ? "Os utilizadores responderão com frases livres." : "As respostas formarão uma nuvem visual."}
                            </p>
                          )}
                        </div>
                      )}

                      {/* CONTEÚDO COMPACTADO */}
                      {el.isCollapsed && (
                        <div style={{ color: '#888', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {el.prompt || el.content || "(Sem título)"}
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

      <button type="submit" style={styles.buttonSuccess}>FINALIZAR E PUBLICAR</button>
    </form>
  </div>
);
}
