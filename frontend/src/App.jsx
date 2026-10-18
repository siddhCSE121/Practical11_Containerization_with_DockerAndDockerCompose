import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      showStatus('Could not reach the backend. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description, priority })
      });
      const data = await res.json();
      if (data.success) {
        showStatus('Task added.');
        setTitle('');
        setDescription('');
        fetchTasks();
      }
    } catch (err) {
      showStatus('Could not add task.', 'error');
    }
  };

  const handleToggle = async (task) => {
    try {
      const res = await fetch(`${API_URL}/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (err) {
      showStatus('Could not update task.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showStatus('Task deleted.');
        fetchTasks();
      }
    } catch (err) {
      showStatus('Could not delete task.', 'error');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <p>AWDF Practical 11 &middot; Docker Compose stack</p>
      </header>

      <div className="pipeline">
        <span className="svc">frontend<span className="port">:5173</span></span>
        <span className="arrow">&rarr;</span>
        <span className="svc">backend<span className="port">:5000</span></span>
        <span className="arrow">&rarr;</span>
        <span className="svc">mongodb<span className="port">:27017</span></span>
      </div>

      <main>
        {statusMsg.text && <div className={`alert ${statusMsg.type}`}>{statusMsg.text}</div>}

        <section className="section">
          <div className="section-head">
            <h2>New task</h2>
          </div>

          <form className="task-form" onSubmit={handleCreateTask}>
            <label className="field">
              <span className="label">Title</span>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="label">Description</span>
              <input
                type="text"
                placeholder="Optional details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="form-row">
              <label className="field">
                <span className="label">Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <button className="primary" type="submit">Add task</button>
            </div>
          </form>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Tasks <span className="count">{tasks.length}</span></h2>
            <button className="ghost" onClick={fetchTasks}>Refresh</button>
          </div>

          {loading && <p className="empty">Loading...</p>}

          {!loading && tasks.length === 0 && <p className="empty">No tasks yet. Add one above.</p>}

          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id} className={task.completed ? 'done' : ''}>
                <label className="task-main">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggle(task)}
                  />
                  <span className="task-text">
                    <span className="task-title">{task.title}</span>
                    {task.description && <span className="task-desc">{task.description}</span>}
                  </span>
                </label>

                <div className="task-actions">
                  <span className={`tag ${task.priority || 'medium'}`}>
                    {task.priority || 'medium'}
                  </span>
                  <button className="delete" onClick={() => handleDelete(task._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="app-footer">
        AWDF Practical 11 &middot; Charotar University of Science and Technology
      </footer>
    </div>
  );
}

export default App;
