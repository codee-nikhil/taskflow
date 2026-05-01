import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) throw new Error('Name is required');
        await signup(form.name, form.email, form.password, form.role);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800 }}>TaskFlow</span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Team collaboration & task management</p>
        </div>

        <div className="tabs" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <button className={`tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`tab${mode === 'signup' ? ' active' : ''}`} onClick={() => setMode('signup')}>Create Account</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
                Admins can manage users and all projects
              </div>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 14, background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--text)' }}>Quick demo:</strong> Use any email/password to create an account, or sign in with existing credentials.
        </div>
      </div>
    </div>
  );
}
