import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <main className="page">
      <header>
        <p className="badge">Vite + React (Bun)</p>
        <h1>nextjs-chatbot</h1>
      </header>
      <section>
        <p>Edit <code>src/App.tsx</code> and save to reload.</p>
        <button
          onClick={() =>
            setMessages((prev) => [...prev, "Hello from your new app!"])
          }
        >
          Add message
        </button>
        <ul>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
