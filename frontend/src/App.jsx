import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";
const API_HOST = API_URL.replace(/^https?:\/\//, "");

const VIEWS = [
  { id: "all", label: "All tasks", icon: "list" },
  { id: "pending", label: "Pending", icon: "clock" },
  { id: "completed", label: "Completed", icon: "checkCircle" },
];

/* ------------------------------------------------------------------ */
/* API helper: same endpoints, methods and payloads as before          */
/* ------------------------------------------------------------------ */
async function request(
  path,
  { method = "GET", body, parseJson = true, errorMessage = "Request failed" } = {}
) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`${errorMessage}: the server could not be reached`);
  }

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return parseJson ? response.json() : null;
}

/* ------------------------------------------------------------------ */
/* Inline SVG icons (no icon library needed)                           */
/* ------------------------------------------------------------------ */
const ICONS = {
  bolt: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v5h-5" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5M12 16h.01" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5l1.5-3h5" />
      <path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
    </>
  ),
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational components                                     */
/* ------------------------------------------------------------------ */
function ConnectionStatus({ health, onRetry, compact = false }) {
  const label = {
    checking: "Connecting…",
    online: "Backend online",
    offline: "Backend offline",
  }[health.state];

  const detail =
    health.state === "online" && health.detail
      ? health.detail
      : health.state === "offline"
      ? `Can't reach ${API_HOST}`
      : API_HOST;

  if (compact) {
    return (
      <span className={`status-dot-only is-${health.state}`} title={label}>
        <span className="status-dot" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <div className={`connection is-${health.state}`}>
      <span className="status-dot" aria-hidden="true" />
      <div className="connection-text" role="status">
        <span className="connection-label">{label}</span>
        <span className="connection-detail" title={detail}>
          {detail}
        </span>
      </div>
      {health.state !== "checking" && (
        <button
          type="button"
          className="icon-button"
          onClick={onRetry}
          aria-label="Re-check backend connection"
          title="Re-check connection"
        >
          <Icon name="refresh" size={16} />
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone, loading, unavailable }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="stat-value">
        {loading ? <span className="skeleton skeleton-number" /> : unavailable ? "–" : value}
      </p>
    </article>
  );
}

function TaskCard({ task, busy, confirming, onToggle, onDelete }) {
  const done = Boolean(task.completed);

  return (
    <li className={`task-card${done ? " is-done" : ""}${busy ? " is-busy" : ""}`}>
      <button
        type="button"
        className="task-check"
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={done ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as complete`}
      >
        <Icon name="check" size={13} />
      </button>

      <div className="task-body">
        <h3 className="task-title">{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge ${done ? "badge-done" : "badge-pending"}`}>
            <span className="badge-dot" aria-hidden="true" />
            {done ? "Completed" : "Pending"}
          </span>
          <span className="task-key">QB-{task.id}</span>
        </div>
      </div>

      <div className="task-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onToggle(task)}
          disabled={busy}
          aria-label={done ? `Undo "${task.title}"` : `Complete "${task.title}"`}
        >
          <Icon name={done ? "undo" : "check"} size={15} />
          <span>{done ? "Undo" : "Complete"}</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${confirming ? "btn-danger" : "btn-ghost btn-icon btn-delete"}`}
          onClick={() => onDelete(task)}
          disabled={busy}
          aria-label={confirming ? `Confirm delete "${task.title}"` : `Delete "${task.title}"`}
          title={confirming ? "Click again to delete" : "Delete task"}
        >
          <Icon name="trash" size={15} />
          {confirming && <span>Confirm</span>}
        </button>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="task-list" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <li key={item} className="task-card skeleton-card">
          <span className="skeleton skeleton-circle" />
          <div className="task-body">
            <span className="skeleton skeleton-line" style={{ width: "42%" }} />
            <span className="skeleton skeleton-line" style={{ width: "68%" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
function App() {
  // Data
  const [health, setHealth] = useState({ state: "checking", detail: "" });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // UI
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const searchRef = useRef(null);
  const titleRef = useRef(null);
  const closeNavRef = useRef(null);

  /* ---------- Backend health ---------- */
  const fetchHealth = useCallback(async () => {
    try {
      const data = await request("/health", { errorMessage: "Backend request failed" });
      setHealth({ state: "online", detail: data?.status ? String(data.status) : "" });
    } catch {
      setHealth({ state: "offline", detail: "" });
    }
  }, []);

  /* ---------- Load tasks ---------- */
  const fetchTasks = useCallback(async () => {
    try {
      const data = await request("/tasks", { errorMessage: "Unable to load tasks" });
      setTasks(Array.isArray(data) ? data : []);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchTasks();
  }, [fetchHealth, fetchTasks]);

  function retryConnection() {
    setHealth({ state: "checking", detail: "" });
    fetchHealth();
    if (loadError) {
      setLoading(true);
      setLoadError("");
      fetchTasks();
    }
  }

  function retryTasks() {
    setLoading(true);
    setLoadError("");
    fetchTasks();
    setHealth({ state: "checking", detail: "" });
    fetchHealth();
  }

  /* ---------- Helpers ---------- */
  function setBusy(id, isBusy) {
    setBusyIds((previous) => {
      const next = new Set(previous);
      if (isBusy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /* ---------- Create a new task ---------- */
  async function createTask(event) {
    event.preventDefault();

    if (!title.trim() || saving) return;

    setError("");
    setSaving(true);

    try {
      const newTask = await request("/tasks", {
        method: "POST",
        body: {
          title: title.trim(),
          description: description.trim(),
          completed: false,
        },
        errorMessage: "Failed to create task",
      });

      setTasks((previousTasks) => [...previousTasks, newTask]);
      setTitle("");
      setDescription("");
      setAnnouncement(`Task "${newTask.title}" created`);
      titleRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Toggle task completion (complete / undo) ---------- */
  async function toggleTask(task) {
    if (busyIds.has(task.id)) return;

    setError("");
    setBusy(task.id, true);

    try {
      const updatedTask = await request(`/tasks/${task.id}`, {
        method: "PUT",
        body: {
          title: task.title,
          description: task.description,
          completed: !task.completed,
        },
        errorMessage: "Failed to update task",
      });

      setTasks((previousTasks) =>
        previousTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item))
      );
      setAnnouncement(
        updatedTask.completed
          ? `"${updatedTask.title}" marked complete`
          : `"${updatedTask.title}" moved back to pending`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(task.id, false);
    }
  }

  /* ---------- Delete a task (click twice to confirm) ---------- */
  async function deleteTask(task) {
    if (busyIds.has(task.id)) return;

    if (confirmDeleteId !== task.id) {
      setConfirmDeleteId(task.id);
      return;
    }

    setConfirmDeleteId(null);
    setError("");
    setBusy(task.id, true);

    try {
      await request(`/tasks/${task.id}`, {
        method: "DELETE",
        parseJson: false,
        errorMessage: "Failed to delete task",
      });

      setTasks((previousTasks) => previousTasks.filter((item) => item.id !== task.id));
      setAnnouncement(`Task "${task.title}" deleted`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(task.id, false);
    }
  }

  // Reset the delete confirmation after 3 seconds
  useEffect(() => {
    if (confirmDeleteId === null) return undefined;
    const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  /* ---------- Keyboard: "/" focuses search, Esc closes menu ---------- */
  useEffect(() => {
    function onKeyDown(event) {
      const tag = event.target.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable;

      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (navOpen) closeNavRef.current?.focus();
  }, [navOpen]);

  /* ---------- Derived data (always from real task data) ---------- */
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, rate };
  }, [tasks]);

  const statsUnavailable = Boolean(loadError);
  const counts = { all: stats.total, pending: stats.pending, completed: stats.completed };

  const visibleTasks = useMemo(() => {
    const term = query.trim().toLowerCase();

    return tasks.filter((task) => {
      if (filter === "pending" && task.completed) return false;
      if (filter === "completed" && !task.completed) return false;
      if (!term) return true;
      return `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase().includes(term);
    });
  }, [tasks, filter, query]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let progressCaption = "Add a task to start tracking progress.";
  if (statsUnavailable) progressCaption = "Waiting for task data from the backend.";
  else if (stats.total > 0 && stats.pending === 0) progressCaption = "Everything is done. Nice work.";
  else if (stats.total > 0)
    progressCaption = `${stats.pending} ${stats.pending === 1 ? "task" : "tasks"} left to go.`;

  const activeView = VIEWS.find((view) => view.id === filter);

  function selectView(id) {
    setFilter(id);
    setNavOpen(false);
  }

  function clearSearchAndFilter() {
    setQuery("");
    setFilter("all");
  }

  /* ---------- Task list body ---------- */
  let listContent;

  if (loading) {
    listContent = (
      <>
        <p className="sr-only" role="status">
          Loading tasks…
        </p>
        <SkeletonList />
      </>
    );
  } else if (loadError) {
    listContent = (
      <EmptyState
        icon="alert"
        title="Couldn't load your tasks"
        text={`${loadError}. Check that the API is running on ${API_HOST}, then try again.`}
        action={
          <button type="button" className="btn btn-secondary" onClick={retryTasks}>
            <Icon name="refresh" size={16} />
            Try again
          </button>
        }
      />
    );
  } else if (tasks.length === 0) {
    listContent = (
      <EmptyState
        icon="inbox"
        title="No tasks yet"
        text="Create your first task to start building momentum."
        action={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => titleRef.current?.focus()}
          >
            <Icon name="plus" size={16} />
            Create a task
          </button>
        }
      />
    );
  } else if (visibleTasks.length === 0) {
    listContent = (
      <EmptyState
        icon="search"
        title="No matching tasks"
        text={
          query.trim()
            ? `Nothing in ${activeView.label.toLowerCase()} matches "${query.trim()}".`
            : `You have no ${activeView.label.toLowerCase()} right now.`
        }
        action={
          <button type="button" className="btn btn-secondary" onClick={clearSearchAndFilter}>
            Clear search and filters
          </button>
        }
      />
    );
  } else {
    listContent = (
      <ul className="task-list">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            busy={busyIds.has(task.id)}
            confirming={confirmDeleteId === task.id}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Mobile top bar */}
      <header className="topbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={navOpen}
          aria-controls="sidebar"
        >
          <Icon name="menu" />
        </button>
        <div className="brand brand-compact">
          <span className="brand-mark">
            <Icon name="bolt" size={15} />
          </span>
          <span className="brand-name">QuickBuild</span>
        </div>
        <ConnectionStatus health={health} onRetry={retryConnection} compact />
      </header>

      {/* Sidebar */}
      <aside id="sidebar" className={`sidebar${navOpen ? " is-open" : ""}`} aria-label="Sidebar">
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="bolt" size={16} />
            </span>
            <div>
              <span className="brand-name">QuickBuild</span>
              <span className="brand-sub">Personal workspace</span>
            </div>
          </div>
          <button
            type="button"
            ref={closeNavRef}
            className="icon-button sidebar-close"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Task views">
          <p className="nav-heading">Views</p>
          <ul>
            {VIEWS.map((view) => {
              const active = filter === view.id;
              return (
                <li key={view.id}>
                  <button
                    type="button"
                    className={`nav-item${active ? " is-active" : ""}`}
                    onClick={() => selectView(view.id)}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon name={view.icon} size={17} />
                    <span>{view.label}</span>
                    <span className="nav-count">{loading || statsUnavailable ? "–" : counts[view.id]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-foot">
          <ConnectionStatus health={health} onRetry={retryConnection} />
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

      {/* Main content */}
      <main id="main" className="main" tabIndex={-1}>
        <div className="main-inner">
          <header className="page-header">
            <div>
              <p className="eyebrow">{today}</p>
              <h1>{greeting}</h1>
              <p className="subtitle">Here's where your work stands today.</p>
            </div>

            <div className="search">
              <Icon name="search" size={17} />
              <label htmlFor="task-search" className="sr-only">
                Search tasks
              </label>
              <input
                id="task-search"
                ref={searchRef}
                type="search"
                placeholder="Search tasks…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
              <kbd aria-hidden="true">/</kbd>
            </div>
          </header>

          {error && (
            <div className="banner" role="alert">
              <Icon name="alert" size={18} />
              <span>{error}</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          {/* Overview */}
          <section className="stats" aria-label="Task overview">
            <StatCard label="Total tasks" value={stats.total} icon="layers" tone="accent" loading={loading} unavailable={statsUnavailable} />
            <StatCard label="Completed" value={stats.completed} icon="checkCircle" tone="success" loading={loading} unavailable={statsUnavailable} />
            <StatCard label="Pending" value={stats.pending} icon="clock" tone="warning" loading={loading} unavailable={statsUnavailable} />

            <article className="stat-card progress-card">
              <div className="stat-top">
                <span className="stat-label" id="progress-label">
                  Completion
                </span>
                <span className="stat-value stat-value-inline">
                  {loading ? (
                    <span className="skeleton skeleton-number" />
                  ) : statsUnavailable ? (
                    "–"
                  ) : (
                    `${stats.rate}%`
                  )}
                </span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-labelledby="progress-label"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats.rate}
              >
                <span className="progress-fill" style={{ width: `${loading ? 0 : stats.rate}%` }} />
              </div>
              <p className="progress-caption">{loading ? "Loading…" : progressCaption}</p>
            </article>
          </section>

          {/* Create */}
          <section className="panel composer" aria-labelledby="composer-title">
            <h2 id="composer-title" className="panel-title">
              New task
            </h2>
            <form className="composer-form" onSubmit={createTask}>
              <div className="field field-title">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  ref={titleRef}
                  type="text"
                  placeholder="What needs doing?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="field field-description">
                <label htmlFor="task-description">
                  Description <span className="optional">(optional)</span>
                </label>
                <input
                  id="task-description"
                  type="text"
                  placeholder="Add a little context"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary composer-submit"
                disabled={saving || !title.trim()}
              >
                {saving ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={16} />
                    Add task
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Tasks */}
          <section className="panel tasks-panel" aria-labelledby="tasks-title" aria-busy={loading}>
            <div className="tasks-header">
              <h2 id="tasks-title" className="panel-title">
                {activeView.label}
                {!loading && !loadError && <span className="title-count">{visibleTasks.length}</span>}
              </h2>

              <div className="segmented" role="group" aria-label="Filter tasks">
                {VIEWS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    className={`segment${filter === view.id ? " is-active" : ""}`}
                    onClick={() => setFilter(view.id)}
                    aria-pressed={filter === view.id}
                  >
                    {view.id === "all" ? "All" : view.label}
                  </button>
                ))}
              </div>
            </div>

            {listContent}
          </section>
        </div>
      </main>

      {/* Screen-reader announcements for actions */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

export default App;
