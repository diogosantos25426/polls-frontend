import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { io } from 'socket.io-client';

export default function PollQRCode() {
  const { pollId } = useParams(); // No contexto de Meeting, este ID é o meetingId
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [starting, setStarting] = useState(false);
  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null });

  const socketRef = useRef(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const FRONTEND_BASE = window.location.origin;

  useEffect(() => {
    async function fetchMeetingData() {
      try {
        const res = await fetch(`${API_BASE}/api/meetings/${pollId}/stats`);
        if (!res.ok) throw new Error('Reunião não encontrada');
        const data = await res.json();
        
        // Ajuste para bater com a estrutura do teu backend
        setPoll(data.poll);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error('Erro ao carregar dados da reunião:', err);
      }
    }

    fetchMeetingData();

    // Configuração do Socket
    socketRef.current = io(API_BASE, { 
      transports: ['websocket'],
      upgrade: false 
    });

    socketRef.current.on('connect', () => {
      console.log("✅ Socket conectado ao QR Code");
      socketRef.current.emit('joinPoll', { pollId: Number(pollId), name: 'HOST' });

      try {
        socketRef.current.emit('getParticipants', { pollId: Number(pollId) }, (list) => {
          if (Array.isArray(list)) {
            console.log('🔍 Lista de participantes recebida (ACK):', list);
            setParticipants(list);
          }
        });
      } catch (e) {
        console.log('🔍 getParticipants não suportado ou falhou', e);
      }

      socketRef.current.on('currentParticipants', (list) => {
        if (Array.isArray(list)) setParticipants(list);
      });
    });

    socketRef.current.on('participantJoined', (participant) => {
      setParticipants((prev) => {
        if (prev.some(p => p.name === participant.name)) return prev;
        return [...prev, participant];
      });
    });

    socketRef.current.on('participantLeft', (participant) => {
      setParticipants(prev => prev.filter(p => p.name !== participant.name));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [pollId, API_BASE]);

  function handleStart() {
  if (!socketRef.current || !socketRef.current.connected) {
    setModal({
      show: true,
      title: "Erro",
      message: "Ligação perdida. Tenta novamente em segundos.",
      type: "error",
      onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
    return;
  }

  if (questions.length === 0) {
    setModal({
      show: true,
      title: "Aviso",
      message: "A carregar perguntas...",
      type: "warning",
      onConfirm: () => setModal({ show: false, title: "", message: "", type: "info", onConfirm: null, onCancel: null })
    });
    return;
  }

  setStarting(true);
  
  socketRef.current.emit('startPoll', {
    pollId: Number(pollId),
    questionIds: questions.map(q => q.id)
  }, (response) => {
    console.log("🚀 Servidor confirmou início:", response);
    navigate(`/meeting/${pollId}/host`, { replace: true });
  });

  setTimeout(() => {
    if (starting) navigate(`/meeting/${pollId}/host`, { replace: true });
  }, 3000);

  }
  if (!poll) {
    return (
      <div style={{ background: '#050505', color: '#6366f1', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <h1 style={{ fontFamily: 'sans-serif' }}>A carregar reunião...</h1>
        <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #111; border-top: 4px solid #6366f1; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const voteUrl = `${FRONTEND_BASE}/lobby/${pollId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(voteUrl)}`;

  return (
    <div style={{
      justifyContent: 'flex-start',
      height: '100vh',
      margin: '0',
      maxWidth: '1200px',
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      backgroundColor: '#111',
      borderRadius: '16px',
      color: 'white',
      overflow: 'hidden',
      border: '1px solid #222',
      fontFamily: 'sans-serif',
      boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
      position: 'relative',
      padding: '8px',
      boxSizing: 'border-box',
      alignItems: 'stretch'
    }}>
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

      {/* COLUNA ESQUERDA: QR E INFO */}
      <div style={{
        flex: '1 1 auto',
        minWidth: 0,
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        borderRight: '1px solid #222',
        gap: '12px'
      }}>
        <div style={{ background: 'rgba(99,102,241,0.1)', padding: '8px 16px', borderRadius: '10px', color: '#6366f1', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '15px', textTransform: 'uppercase' }}>
          Modo Reunião Ativo
        </div>
        <h1 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 6px 0', lineHeight: '1.2' }}>{poll.title}</h1>
        <p style={{ color: '#888', marginBottom: '12px', fontSize: '0.95rem' }}>Sessão focada apenas em interatividade.</p>

        <div style={{
          background: 'white',
          padding: '8px',
          borderRadius: '16px',
          display: 'inline-block',
          marginBottom: '8px'
        }}>
          <img 
            src={qrUrl} 
            alt="QR Code" 
            style={{ width: '100%', maxWidth: '220px', maxHeight: '32vh', height: 'auto', display: 'block' }} 
          />
        </div>

        <div style={{ marginBottom: '12px', width: '100%', maxWidth: '440px' }}>
          <p style={{ fontSize: '0.95rem', marginBottom: '8px', fontWeight: '500', color: '#bbb' }}>Acede através do link:</p>
          <div style={{
            background: '#050505',
            padding: '8px',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '0.85rem',
            border: '1px solid #222',
            wordBreak: 'break-all',
            fontFamily: 'monospace'
          }}>
            {voteUrl}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          style={{
            padding: '10px 22px',
            background: starting ? '#333' : '#6366f1',
            color: 'white',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '12px',
            cursor: starting ? 'not-allowed' : 'pointer',
            fontWeight: '700',
            transition: 'all 0.2s ease',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 8px 16px rgba(99,102,241,0.18)'
          }}
        >
          {starting ? 'A INICIAR SESSÃO...' : 'LANÇAR AGORA'}
        </button>
      </div>

      {/* COLUNA DIREITA: PARTICIPANTES */}
      <aside style={{
        flex: '0 0 320px',
        padding: '12px',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <h2 style={{
          fontSize: '1.1rem',
          color: '#888',
          marginBottom: '25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 'normal'
        }}>
          PARTICIPANTES 
          <span style={{ fontSize: '0.9rem', background: '#6366f1', padding: '4px 12px', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>
            {participants.length}
          </span>
        </h2>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '8px',
          alignContent: 'flex-start'
        }}>
          {participants.length === 0 ? (
            <div style={{ padding: '10px', border: '1px dashed #222', borderRadius: '12px', textAlign: 'center', width: '100%' }}>
               <p style={{ color: '#444', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>Aguardando entrada pela audiência...</p>
            </div>
          ) : (
            participants.map((p, i) => (
              <div key={i} style={{
                background: '#111',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #222',
                fontSize: '0.85rem',
                color: '#efefef',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.3s ease-out',
                width: '48%'
              }}>
                <span style={{ color: '#10b981' }}>●</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
