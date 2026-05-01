import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: 'var(--text2)', medium: 'var(--yellow)', high: 'var(--red)', critical: '#ff6b6b' };

function isOverdue(due_date) {
  return due_date && new Date(due_date) < new Date() && true;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/stats').then(d => setStats(d)).finally(() => setLoading(false));
  }, []);

  const statusMap = {};
  stats?.taskStats?.forEach(s => { statusMap[s.status] = s.count; });
  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const statCards = [
    { label: 'Total Tasks', value: total, color: 'var(--accent2)', icon: '◎' },
    { label: 'In Progress', value: statusMap.in_progress || 0, color: 'var(--cyan)', icon: '⟳' },
    { label: 'In Review', value: statusMap.review || 0, color: 'var(--yellow)', icon: '⊙' },
    { label: 'Completed', value: statusMap.done || 0, color: 'var(--green)', icon: '✓' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <p style={{ color: 'var(--text2)' }}>Loading dashboard...</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid-4 mb-4">
              {statCards.map(c => (
                <div key={c.label} className="stat-card">
                  <div style={{ fontSize: 20, marginBottom: 10, color: c.color }}>{c.icon}</div>
                  <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2">
              {/* Recent Tasks */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontFamily: 'Syne', fontWeight: 700 }}>Recent Tasks</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/tasks')}>View All</button>
                </div>

                {stats?.recentTasks?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <div className="empty-icon">✓</div>
                    <p className="text-muted">No tasks yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats?.recentTasks?.map(task => (
                      <div key={task.id} className="task-card" onClick={() => navigate(`/projects/${task.project_id}`)}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span style={{ fontWeight: 500, fontSize: 13 }} className="truncate">{task.title}</span>
                          <span className={`badge status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="chip" style={{ '--bg3': task.project_color + '22', borderColor: task.project_color + '44' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.project_color, display: 'inline-block' }}></span>
                            {task.project_name}
                          </span>
                          {task.due_date && (
                            <span style={{ fontSize: 11, color: isOverdue(task.due_date) ? 'var(--red)' : 'var(--text3)' }}>
                              {isOverdue(task.due_date) ? '⚠ ' : ''}
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overdue Tasks */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontFamily: 'Syne', fontWeight: 700 }}>
                    Overdue <span style={{ color: 'var(--red)', fontSize: 13, fontFamily: 'DM Sans' }}>
                      {stats?.overdueTasks?.length > 0 ? `(${stats.overdueTasks.length})` : ''}
                    </span>
                  </h3>
                </div>

                {stats?.overdueTasks?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <div className="empty-icon" style={{ opacity: 0.6 }}>🎉</div>
                    <div className="empty-title" style={{ fontSize: 15 }}>All caught up!</div>
                    <p className="text-muted text-sm">No overdue tasks</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stats.overdueTasks.map(task => (
                      <div key={task.id} className="task-card" onClick={() => navigate(`/projects/${task.project_id}`)}
                        style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span style={{ fontWeight: 500, fontSize: 13 }} className="truncate">{task.title}</span>
                          <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.project_name}</span>
                          <span className="overdue-badge">
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Task status breakdown */}
            <div className="card mt-4">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 16 }}>Task Status Breakdown</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['todo', 'in_progress', 'review', 'done'].map(s => {
                  const count = statusMap[s] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={s} style={{ flex: 1, minWidth: 100 }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge status-${s}`}>{STATUS_LABELS[s]}</span>
                        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18 }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${pct}%`,
                          background: s === 'done' ? 'var(--green)' : s === 'in_progress' ? 'var(--cyan)' : s === 'review' ? 'var(--yellow)' : 'var(--text3)'
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
