import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";

export default function LiveStats() {
  const { pollId } = useParams();
  const [stats, setStats] = useState(null);

  const socket = io("http://localhost:4000");

  useEffect(() => {
    socket.emit("joinPoll", { pollId });

    socket.on("questionChanged", () => fetchStats());
    socket.on("responseCreated", () => fetchStats());

    fetchStats();
  }, []);

  async function fetchStats() {
    const res = await fetch(
      `http://localhost:4000/api/polls/${pollId}/stats`
    );
    const data = await res.json();
    setStats(data);
  }

  function lock() {
    socket.emit("lockQuestion", { pollId });
  }

  function next() {
    socket.emit("nextQuestion", { pollId });
  }

  if (!stats) return <div>A carregar…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>{stats.poll.title}</h2>

      {stats.questions.map(q => (
        <div key={q.id}>
          <h4>{q.prompt}</h4>
          {q.options && (
            <Bar
              data={{
                labels: q.options.map(o => o.text),
                datasets: [{ data: q.options.map(o => o.votes) }]
              }}
            />
          )}
        </div>
      ))}

      <button onClick={lock}>🔒 Bloquear</button>
      <button onClick={next}>▶ Próxima</button>
    </div>
  );
}
