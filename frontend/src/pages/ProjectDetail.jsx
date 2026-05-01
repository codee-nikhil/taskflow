import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'var(--text2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--cyan)' },
  { key: 'review', label: 'Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function TaskModal({ task, members, projectId, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const isNew = !task;
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '', status: task.status,
    priority: task.priority, assignee_id: task.assignee_id || '', due_date: task.due_date || ''
  } : { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isNew && activeTab === 'comments') {
      api.get(`/tasks/${task.id}`).then(d => setComments(d.comments));
    }
  }, [activeTab, task?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      let saved;
      if (isNew) {
        const data = await api.post('/tasks', { ...body, project_id: projectId });
        saved = data.task;
      } else {
        const data = await api.put(`/tasks/${task.id}`, body);
        saved = data.task;
      }
      onSaved(saved, isNew);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${task.id}`);
    onDeleted(task.id);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    const data = await api.post(`/tasks/${task.id}/comments`, { content: newComment });
    setComments(c => [...c, data.comment]);
    setNewComment('');
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {!isNew && (
          <div className="tabs" style={{ margin: '0 24px' }}>
            <button className={`tab${activeTab === 'details' ? ' active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
            <button className={`tab${activeTab === 'comments' ? ' active' : ''}`} onClick={() => setActiveTab('comments')}>Comments</button>
          </div>
        )}

        <div className="modal-body" style={{ paddingTop: isNew ? 20 : 12 }}>
          {activeTab === 'details' ? (
            <>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input form-textarea" placeholder="Add more details..." value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-select" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input className="form-input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  {!isNew && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete Task</button>
                  )}
                  <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                {comments.length === 0 ? (
                  <p style={{ color: 'var(--text2)', fontSize: 13 }}>No comments yet. Be the first!</p>
                ) : comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                    <div className="avatar" style={{ background: c.avatar_color, flexShrink: 0 }}>{initials(c.user_name)}</div>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.user_name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>{c.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input flex-1" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
                <button className="btn btn-primary" onClick={handleComment}>Post</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [tab, setTab] = useState('board');

  const load = () => {
    api.get(`/projects/${id}`).then(d => setData(d)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleTaskSaved = (task, isNew) => {
    setData(d => ({
      ...d,
      tasks: isNew ? [task, ...d.tasks] : d.tasks.map(t => t.id === task.id ? task : t)
    }));
    setSelectedTask(null);
    setShowNewTask(false);
  };

  const handleTaskDeleted = (taskId) => {
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== taskId) }));
    setSelectedTask(null);
  };

  const handleAddMember = async () => {
    setMemberError('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      load();
    } catch (err) {
      setMemberError(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    load();
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  if (loading) return <div className="page-body" style={{ color: 'var(--text2)' }}>Loading...</div>;
  if (!data?.project) return <div className="page-body"><p>Project not found. <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>Back</button></p></div>;

  const { project, members = [], tasks = [] } = data;
  const isAdmin = user.role === 'admin' || project.owner_id === user.id ||
    members.find(m => m.id === user.id)?.project_role === 'admin';

  const tasksByStatus = {};
  STATUSES.forEach(s => { tasksByStatus[s.key] = tasks.filter(t => t.status === s.key); });

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate('/projects')}>←</button>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>👥 {members.length}</button>
          <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>+ Add Task</button>
        </div>
      </div>

      <div style={{ padding: '0 32px' }}>
        <div className="tabs">
          <button className={`tab${tab === 'board' ? ' active' : ''}`} onClick={() => setTab('board')}>Board</button>
          <button className={`tab${tab === 'list' ? ' active' : ''}`} onClick={() => setTab('list')}>List</button>
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        {tab === 'board' ? (
          <div className="kanban-board">
            {STATUSES.map(s => (
              <div key={s.key} className="kanban-col">
                <div className="kanban-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className="dot" style={{ background: s.color }} />
                    {s.label}
                  </div>
                  <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                    {tasksByStatus[s.key].length}
                  </span>
                </div>
                <div className="kanban-col-body">
                  {tasksByStatus[s.key].map(task => (
                    <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                      <div style={{ marginBottom: 8 }}>
                        <span className={`badge priority-${task.priority} text-sm`} style={{ marginBottom: 6, display: 'inline-flex' }}>{task.priority}</span>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        {task.assignee_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ background: task.assignee_color, width: 22, height: 22, fontSize: 9 }}>{initials(task.assignee_name)}</div>
                            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{task.assignee_name}</span>
                          </div>
                        ) : <span />}
                        {task.due_date && (
                          <span style={{ fontSize: 11, color: new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text3)' }}>
                            {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text2)' }}>No tasks yet</td></tr>
                ) : tasks.map(task => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td><span className={`badge status-${task.status}`}>{STATUSES.find(s => s.key === task.status)?.label}</span></td>
                    <td><span className={`badge priority-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      {task.assignee_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="avatar" style={{ background: task.assignee_color, width: 22, height: 22, fontSize: 9 }}>{initials(task.assignee_name)}</div>
                          <span style={{ fontSize: 12 }}>{task.assignee_name}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Unassigned</span>}
                    </td>
                    <td>
                      {task.due_date ? (
                        <span style={{ fontSize: 12, color: new Date(task.due_date) < new Date() && task.status !== 'done' ? 'var(--red)' : 'var(--text2)' }}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {(selectedTask || showNewTask) && (
        <TaskModal
          task={selectedTask}
          members={members}
          projectId={id}
          onClose={() => { setSelectedTask(null); setShowNewTask(false); }}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMembers(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Team Members</h2>
              <button className="btn-icon" onClick={() => setShowMembers(false)}>✕</button>
            </div>
            <div className="modal-body">
              {isAdmin && (
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Add Member by Email</label>
                  {memberError && <div className="alert alert-error" style={{ marginBottom: 8 }}>{memberError}</div>}
                  <div className="flex gap-2">
                    <input className="form-input flex-1" placeholder="user@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMember()} />
                    <button className="btn btn-primary" onClick={handleAddMember}>Add</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div className="avatar avatar-lg" style={{ background: m.avatar_color }}>{initials(m.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.email}</div>
                    </div>
                    <span className="user-role">{m.project_role}</span>
                    {isAdmin && m.id !== user.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
