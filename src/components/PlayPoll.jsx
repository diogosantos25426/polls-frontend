import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

export default function PlayPoll() {
  const { pollId } = useParams();
  const [socket, setSocket] = useState(null);
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:4000");
    setSocket(s);

    s.emit("joinPlay", { pollId });

    s.on("question", setQuestion);

    return () => s.disconnect();
  }, [pollId]);

  function sendAnswer(answer) {
    socket.emit("answer", {
      pollId,
      questionId: question.id,
      answer
    });
  }

  if (!question) return <div>A aguardar pergunta…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>{question.prompt}</h2>

      {question.options ? (
        question.options.map(o => (
          <button key={o.id} onClick={() => sendAnswer(o.id)}>
            {o.text}
          </button>
        ))
      ) : (
        <input
          placeholder="Resposta"
          onKeyDown={(e) => e.key === "Enter" && sendAnswer(e.target.value)}
        />
      )}
    </div>
  );
}
