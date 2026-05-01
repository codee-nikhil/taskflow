const express = require('express');
const db = require('../models/db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - admin only
router.get('/', auth, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// GET /api/users/search?q=
router.get('/search', auth, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const users = db.prepare(
    'SELECT id, name, email, avatar_color FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10'
  ).all(q, q);
  res.json({ users });
});

// PUT /api/users/:id/role - admin only
router.put('/:id/role', auth, adminOnly, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

// GET /api/users/stats - dashboard stats
router.get('/stats', auth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const userId = req.user.id;

  const tasksQuery = isAdmin
    ? 'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
    : `SELECT t.status, COUNT(*) as count FROM tasks t
       LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
       WHERE t.assignee_id = ? OR pm.user_id = ?
       GROUP BY t.status`;

  const taskStats = isAdmin
    ? db.prepare(tasksQuery).all()
    : db.prepare(tasksQuery).all(userId, userId, userId);

  const overdueTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar_color as assignee_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.due_date < date('now') AND t.status != 'done'
      AND (t.assignee_id = ? OR p.owner_id = ? OR pm.user_id = ? OR ? = 'admin')
    GROUP BY t.id
    ORDER BY t.due_date ASC
    LIMIT 5
  `).all(userId, userId, userId, userId, req.user.role);

  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar_color as assignee_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE (t.assignee_id = ? OR p.owner_id = ? OR pm.user_id = ? OR ? = 'admin')
    GROUP BY t.id
    ORDER BY t.updated_at DESC
    LIMIT 8
  `).all(userId, userId, userId, userId, req.user.role);

  res.json({ taskStats, overdueTasks, recentTasks });
});

module.exports = router;
