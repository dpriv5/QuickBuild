
import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setStatus(data.status);
      })
      .catch((error) => {
        console.error(error);
        setStatus("Backend unavailable");
      });
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>QuickBuild 🚀</h1>
      <p>Your personal task management platform.</p>

      <h2>Backend Connection</h2>
      <p>Status: {status}</p>
    </main>
  );
}

export default App;
