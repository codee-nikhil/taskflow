const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { auth, projectAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks - all tasks for user (dashboard)
router.get('/', auth, (req, res) => {
  const { status, priority, overdue } = req.query;

  let query = `
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar_color as assignee_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE (t.assignee_id = ? OR p.owner_id = ? OR pm.user_id = ? OR ? = 'admin')
  `;
  const params = [req.user.id, req.user.id, req.user.id, req.user.id, req.user.role];

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (overdue === 'true') { query += " AND t.due_date < date('now') AND t.status != 'done'"; }

  query += ' GROUP BY t.id ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// POST /api/tasks - create task
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('project_id').isInt().withMessage('Project ID required'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('due_date').optional().isISO8601()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, project_id, assignee_id, status = 'todo', priority = 'medium', due_date } = req.body;

  // Check project access
  const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(project_id, req.user.id);
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(project_id);
  if (!member && project?.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No access to this project' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, project_id, assignee_id || null, req.user.id, status, priority, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.creator_id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get('/:id', auth, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.creator_id
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_color
    FROM comments cm JOIN users u ON u.id = cm.user_id
    WHERE cm.task_id = ?
    ORDER BY cm.created_at ASC
  `).all(req.params.id);

  res.json({ task, comments });
});

// PUT /api/tasks/:id - update task
router.put('/:id', auth, [
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, assignee_id, status, priority, due_date } = req.body;

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assignee_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = CASE WHEN ? IS NOT NULL THEN ? ELSE due_date END
    WHERE id = ?
  `).run(title, description, assignee_id, assignee_id, status, priority, due_date, due_date, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.creator_id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(task.project_id);
  if (task.creator_id !== req.user.id && project?.owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', auth, [
  body('content').trim().notEmpty()
], (req, res) => {
  const result = db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, req.body.content);
  const comment = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_color
    FROM comments cm JOIN users u ON u.id = cm.user_id WHERE cm.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json({ comment });
});

module.exports = router;
