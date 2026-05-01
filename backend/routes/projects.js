const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { auth, projectAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - list user's projects
router.get('/', auth, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    WHERE p.owner_id = ? OR pm.user_id = ? OR ? = 'admin'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.role);

  res.json({ projects });
});

// POST /api/projects - create project
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/)
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, color = '#6366f1' } = req.body;

  const result = db.prepare(
    'INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)'
  ).run(name, description, color, req.user.id);

  // Add owner as admin member
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', auth, projectAccess, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name
    FROM projects p JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role as global_role, u.avatar_color, pm.role as project_role, pm.joined_at
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.creator_id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);

  res.json({ project, members, tasks });
});

// PUT /api/projects/:id
router.put('/:id', auth, projectAccess, [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'archived', 'completed'])
], (req, res) => {
  const { name, description, color, status } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  if (project.owner_id !== req.user.id && req.user.role !== 'admin' && req.projectRole !== 'admin') {
    return res.status(403).json({ error: 'Only project admin can edit' });
  }

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      color = COALESCE(?, color),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(name, description, color, status, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ project: updated });
});

// DELETE /api/projects/:id
router.delete('/:id', auth, projectAccess, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only owner can delete project' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', auth, projectAccess, [
  body('email').isEmail()
], (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { email, role = 'member' } = req.body;
  const user = db.prepare('SELECT id, name, email, avatar_color FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const exists = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
  if (exists) return res.status(409).json({ error: 'User already a member' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user.id, role);
  res.status(201).json({ message: 'Member added', user });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, projectAccess, (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
