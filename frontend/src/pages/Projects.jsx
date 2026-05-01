import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const PROJECT_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16'];

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/projects', form);
      onCreated(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" placeholder="What's this project about?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="flex gap-2 wrap">
                {PROJECT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(d => setProjects(d.projects)).finally(() => setLoading(false));
  }, []);

  const handleCreated = (project) => {
    setProjects(p => [project, ...p]);
    setShowNew(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Project</button>
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ color: 'var(--text2)' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◫</div>
            <div className="empty-title">No projects yet</div>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowNew(true)}>Create Project</button>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(p => {
              const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
              return (
                <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + '22', border: `2px solid ${p.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.owner_name}</div>
                    </div>
                    {p.status !== 'active' && (
                      <span className={`badge status-${p.status === 'completed' ? 'done' : 'review'}`}>{p.status}</span>
                    )}
                  </div>

                  {p.description && (
                    <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }} className="truncate">{p.description}</p>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Progress</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--text2)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : p.color }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3" style={{ fontSize: 12, color: 'var(--text2)' }}>
                    <span>✓ {p.done_count}/{p.task_count} tasks</span>
                    <span>👥 {p.member_count}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </>
  );
}
