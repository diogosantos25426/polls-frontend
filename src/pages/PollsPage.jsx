import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const { token } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPolls() {
      const res = await fetch('http://localhost:4000/api/polls', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPolls(data);
    }
    fetchPolls();
  }, [token]);

  return (
    <div>
      <h2>Lista de Sondagens</h2>
      {polls.map(poll => (
        <div key={poll.id} style={{ border: '1px solid gray', padding: 12, marginBottom: 10 }}>
          <h3>{poll.title}</h3>
          <p>{poll.description}</p>
          <button onClick={() => navigate(`/polls/${poll.id}`)}>Responder</button>
        </div>
      ))}
    </div>
  );
}
