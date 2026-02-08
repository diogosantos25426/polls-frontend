import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Bar } from "react-chartjs-2";

export default function Present() {
  const { pollId } = useParams();
  const [question, setQuestion] = useState(null);
  const [stats, setStats] = useState([]);
  const socket = io("http://localhost:4000");

  useEffect(() => {
    socket.emit("joinPoll", { pollId });

    socket.on("questionChanged", ({ question }) => {
      setQuestion(question);
      setStats([]);
    });

    socket.on("responseCreated", (data) => {
      setStats(data.options);
    });

    return () => socket.disconnect();
  }, []);

  function nextQuestion() {
    socket.emit("nextQuestion", { pollId });
  }

  if (!question) return <h2>A aguardar pergunta…</h2>;

  return (
    <div style={{ padding: 40 }}>
      {/* PERGUNTA EM GRANDE */}
      <h1 style={{ fontSize: 42, textAlign: "center" }}>
        {question.prompt}
      </h1>

      {/* RESPOSTAS */}
      {question.options && (
        <div style={{ maxWidth: 700, margin: "40px auto" }}>
          <Bar
            data={{
              labels: stats.map(o => o.text),
              datasets: [
                {
                  label: "Respostas",
                  data: stats.map(o => o.votes),
                },
              ],
            }}
          />
        </div>
      )}

      {/* CONTROLOS */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <button className="reg-btn" onClick={nextQuestion}>
          ▶ Próxima Pergunta
        </button>
      </div>
    </div>
  );
}
