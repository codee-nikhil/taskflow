import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>

          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">⊞</span> Dashboard
          </NavLink>

          <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">◫</span> Projects
          </NavLink>

          <NavLink to="/tasks" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">✓</span> My Tasks
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="icon">⚙</span> User Management
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="avatar" style={{ background: user?.avatar_color }}>{initials}</div>
          <div className="user-info">
            <div className="user-name truncate">{user?.name}</div>
            <span className="user-role">{user?.role}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">↪</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
