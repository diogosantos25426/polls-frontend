// PollStats.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PollPage.css';

function Bars({ options, total }) {
  // mostra barras simples com percentagens
  return (
    <div>
      {options.map(opt => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        return (
          <div key={opt.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>{opt.text}</div>
              <div style={{ color: '#666' }}>{opt.votes} ({pct}%)</div>
            </div>

            <div style={{ background: '#e6e9ee', height: 14, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: '#007bff',
                borderRadius: 6,
                transition: 'width 400ms ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PollStats() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:4000/api/polls/${id}/stats`);
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          throw new Error(txt || 'Erro a obter estatísticas');
        }
        const data = await res.json();
        setPoll(data.poll);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [id]);

  if (loading) return <div className="reg-container"><p style={{ padding: 20 }}>A carregar estatísticas…</p></div>;
  if (error) return <div className="reg-container"><p style={{ padding: 20, color: '#a71d2a' }}>{error}</p></div>;
  if (!poll) return <div className="reg-container"><p style={{ padding: 20 }}>Sondagem não encontrada</p></div>;

  return (
    <div className="reg-container" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="reg-title" style={{ margin: 0 }}>{poll.title}</h2>
        <div>
          <Link to={`/poll/${id}`} className="link-btn" style={{ marginRight: 12 }}>Ver menu da poll</Link>
          <Link to="/" className="link-btn">Voltar ao início</Link>
        </div>
      </div>

      {poll.description && <p style={{ color: '#555' }}>{poll.description}</p>}

      <div style={{ marginTop: 18 }}>
        {questions.map((q, idx) => (
          <div key={q.id} className="question-block">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{idx + 1}. {q.prompt}</div>

            {q.type === 'multiple' ? (
              <>
                <Bars options={q.options} total={q.totalVotes} />
                <div style={{ marginTop: 8, color: '#666' }}>{q.totalVotes} voto(s) no total</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 8, color: '#666' }}>Respostas abertas ({q.responses?.length || 0})</div>
                {(!q.responses || q.responses.length === 0) ? (
                  <div style={{ color: '#777' }}>Ainda sem respostas abertas.</div>
                ) : (
                  <div>
                    {q.responses.map(r => (
                      <div key={r.id} style={{ padding: 10, background: '#fff', borderRadius: 8, border: '1px solid #eee', marginBottom: 8 }}>
                        <div style={{ color: '#333' }}>{r.value}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
