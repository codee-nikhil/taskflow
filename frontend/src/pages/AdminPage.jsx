import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    api.get('/users').then(d => setUsers(d.users)).finally(() => setLoading(false));
  }, []);

  const updateRole = async (userId, role) => {
    await api.put(`/users/${userId}/role`, { role });
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, role } : usr));
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage user roles and access — Admin only</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--text2)' }}>Loading users...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: u.avatar_color }}>{initials(u.name)}</div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                        {u.id === user.id && <span style={{ fontSize: 10, color: 'var(--accent2)', background: 'var(--accent-bg)', padding: '1px 6px', borderRadius: 20 }}>You</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                    <td><span className="user-role">{u.role}</span></td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.id !== user.id ? (
                        <select className="form-select" style={{ width: 120, fontSize: 12, padding: '5px 10px' }}
                          value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card mt-4">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12 }}>Role Permissions</h3>
          <div className="grid-2">
            <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="user-role">admin</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text2)' }}>
                <li>✓ Access all projects</li>
                <li>✓ Manage all users</li>
                <li>✓ Delete any project/task</li>
                <li>✓ Add/remove project members</li>
              </ul>
            </div>
            <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="user-role" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)' }}>member</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text2)' }}>
                <li>✓ Access assigned projects</li>
                <li>✓ Create & update tasks</li>
                <li>✓ Comment on tasks</li>
                <li>✗ Manage other users</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
