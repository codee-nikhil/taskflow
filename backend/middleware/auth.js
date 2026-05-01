const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-production';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, avatar_color FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function projectAccess(req, res, next) {
  const projectId = req.params.projectId || req.body.project_id || req.params.id;
  if (!projectId) return next();

  const membership = db.prepare(
    'SELECT pm.role FROM project_members pm WHERE pm.project_id = ? AND pm.user_id = ?'
  ).get(projectId, req.user.id);

  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);

  if (!membership && (!project || project.owner_id !== req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No access to this project' });
  }

  req.projectRole = project?.owner_id === req.user.id ? 'admin' : (membership?.role || 'member');
  next();
}

module.exports = { auth, adminOnly, projectAccess, JWT_SECRET };
