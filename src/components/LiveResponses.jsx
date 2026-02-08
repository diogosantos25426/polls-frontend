import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export default function LiveResponses() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const socket = io('http://localhost:4000');

  useEffect(() => {
    socket.emit('joinPoll', { pollId: Number(pollId), name: 'HOST' });

    socket.on('answerSubmitted', (response) => {
      setCounts(prev => ({
        ...prev,
        [response.option_id]: (prev[response.option_id] || 0) + 1
      }));
    });

    return () => socket.disconnect();
  }, []);

  function goToAnalysis() {
    socket.emit('lockQuestion', { pollId: Number(pollId) });
    navigate(`/livestats/${pollId}/current`);
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Live Responses</h1>

      {Object.entries(counts).map(([opt, total]) => (
        <div key={opt}>
          Opção {opt}: {total}
        </div>
      ))}

      <button onClick={goToAnalysis}>
        Ir para análise
      </button>
    </div>
  );
}
