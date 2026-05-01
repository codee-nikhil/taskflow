import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: false });
  const navigate = useNavigate();

  const load = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.overdue) params.set('overdue', 'true');
    setLoading(true);
    api.get(`/tasks?${params}`).then(d => setTasks(d.tasks)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const updateStatus = async (taskId, status) => {
    const data = await api.put(`/tasks/${taskId}`, { status });
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, ...data.task } : t));
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="flex gap-3 mb-4 wrap">
          <select className="form-select" style={{ width: 140 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="form-select" style={{ width: 140 }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            className={`btn ${filters.overdue ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilters(f => ({ ...f, overdue: !f.overdue }))}>
            {filters.overdue ? '⚠ Overdue Only' : 'Show Overdue'}
          </button>
          {(filters.status || filters.priority || filters.overdue) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', priority: '', overdue: false })}>Clear</button>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text2)' }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <div className="empty-title">No tasks found</div>
            <p>Try adjusting your filters or create tasks in your projects</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${task.project_id}`)}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }} className="truncate">{task.description}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.project_color }} />
                          <span style={{ fontSize: 12 }}>{task.project_name}</span>
                        </div>
                      </td>
                      <td><span className={`badge priority-${task.priority}`}>{task.priority}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          className="form-select"
                          style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }}
                          value={task.status}
                          onChange={e => updateStatus(task.id, e.target.value)}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td>
                        {task.assignee_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ background: task.assignee_color, width: 22, height: 22, fontSize: 9 }}>{initials(task.assignee_name)}</div>
                            <span style={{ fontSize: 12 }}>{task.assignee_name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        {task.due_date ? (
                          <span style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text2)' }}>
                            {overdue && '⚠ '}{new Date(task.due_date).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
