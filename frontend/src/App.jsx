
import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [status, setStatus] = useState("Checking backend...");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Check backend connection
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("Backend unavailable"));
  }, []);

  // Retrieve existing tasks
  useEffect(() => {
    fetch(`${API_URL}/tasks`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to retrieve tasks");
        }
        return response.json();
      })
      .then((data) => setTasks(data))
      .catch(() => setError("Unable to load tasks"));
  }, []);

  // Create a new task
  async function createTask(event) {
    event.preventDefault();

    if (!title.trim() || saving) return;

    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await response.json();

      setTasks((previousTasks) => [
        ...previousTasks,
        newTask,
      ]);

      setTitle("");
      setDescription("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>QuickBuild 🚀</h1>
      <p>Your personal task management platform.</p>

      <h2>Backend Connection</h2>
      <p>Status: {status}</p>

      <hr />

      <h2>Create a Task</h2>

      <form onSubmit={createTask}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          style={{ padding: "10px", margin: "10px" }}
        />

        <input
          type="text"
          placeholder="Task description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          style={{ padding: "10px", margin: "10px" }}
        />

        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Add Task"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <hr />

      <h2>My Tasks ({tasks.length})</h2>

      {tasks.length === 0 && <p>No tasks yet.</p>}

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            border: "1px solid #555",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "10px",
          }}
        >
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>
            Status: {task.completed ? "Completed" : "Pending"}
          </p>
        </div>
      ))}
    </main>
  );
}

export default App;
