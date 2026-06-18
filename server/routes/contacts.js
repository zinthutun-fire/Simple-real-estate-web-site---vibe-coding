import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Submit contact form (public)
router.post('/', (req, res) => {
  const { name, email, phone, subject, message, property_id } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO contacts (name, email, phone, subject, message, property_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, phone || null, subject || null, message, property_id || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Inquiry received' });
});

// List contacts (admin)
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, p.title as property_title
    FROM contacts c
    LEFT JOIN properties p ON c.property_id = p.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

export default router;
