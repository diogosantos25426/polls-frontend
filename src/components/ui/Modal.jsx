import React from 'react';
import { createPortal } from 'react-dom';

export function Modal({ show, title, message, type = "info", onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar" }) {
  if (!show) return null;
  if (typeof document === 'undefined') return null;

  const typeStyles = {
    success: { bg: "rgba(16, 185, 129, 0.1)", border: "#10b981", icon: "✓", buttonColor: "#10b981" },
    error: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", icon: "✕", buttonColor: "#ef4444" },
    warning: { bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b", icon: "⚠", buttonColor: "#f59e0b" },
    info: { bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6", icon: "ℹ", buttonColor: "#3b82f6" },
    confirm: { bg: "rgba(99, 102, 241, 0.1)", border: "#6366f1", icon: "?", buttonColor: "#6366f1" }
  };

  const style = typeStyles[type] || typeStyles.info;
  const isConfirmModal = onConfirm && onCancel;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      backdropFilter: 'blur(8px)',
      padding: '20px',
      boxSizing: 'border-box',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { transform: translateY(20px); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }
      `}</style>

      <div style={{
        backgroundColor: '#111',
        border: `2px solid ${style.border}`,
        borderRadius: '20px', // Bordas mais suaves
        padding: '35px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: `0 0 30px ${style.bg}, 0 20px 60px rgba(0,0,0,0.8)`,
        fontFamily: 'sans-serif',
        color: 'white',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative' // Relativo ao flex do pai
      }}>
        {/* Header com ícone e título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', // Square rounded fica moderno
            backgroundColor: style.bg, border: `1.5px solid ${style.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', color: style.border, flexShrink: 0
          }}>
            {style.icon}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
            {title}
          </h2>
        </div>

        {/* Mensagem */}
        <p style={{
          fontSize: '0.95rem', lineHeight: '1.6', color: '#aaa',
          margin: '0 0 30px 0', wordWrap: 'break-word'
        }}>
          {message}
        </p>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {isConfirmModal && (
            <button
              onClick={onCancel}
              style={{
                padding: '12px 20px', backgroundColor: 'transparent',
                border: '1px solid #333', color: '#666',
                borderRadius: '10px', cursor: 'pointer', fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#555'; }}
              onMouseLeave={e => { e.target.style.color = '#666'; e.target.style.borderColor = '#333'; }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm || onCancel}
            style={{
              padding: '12px 24px', backgroundColor: style.buttonColor,
              border: 'none', color: 'white',
              borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
              transition: 'transform 0.2s, opacity 0.2s',
              boxShadow: `0 4px 15px ${style.bg}`
            }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.02)'; e.target.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '1'; }}
          >
            {isConfirmModal ? confirmText : 'OK'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}