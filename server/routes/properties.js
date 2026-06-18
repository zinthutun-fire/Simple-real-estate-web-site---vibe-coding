import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function parseProperty(row) {
  return {
    ...row,
    images: JSON.parse(row.images || '[]'),
    amenities: JSON.parse(row.amenities || '[]')
  };
}

// List properties (public)
router.get('/', (req, res) => {
  const db = getDb();
  let query = 'SELECT * FROM properties WHERE 1=1';
  const params = [];

  if (req.query.type) {
    const types = req.query.type.split(',');
    query += ` AND type IN (${types.map(() => '?').join(',')})`;
    params.push(...types);
  }
  if (req.query.minPrice) {
    query += ' AND price >= ?';
    params.push(parseInt(req.query.minPrice));
  }
  if (req.query.maxPrice) {
    query += ' AND price <= ?';
    params.push(parseInt(req.query.maxPrice));
  }
  if (req.query.beds) {
    const bedVals = req.query.beds.split(',').map(Number);
    bedVals.forEach(b => {
      if (b >= 5) query += ' AND beds >= 5';
      else query += ' AND beds = ?';
      if (b < 5) params.push(b);
    });
  }
  if (req.query.badge) {
    query += ' AND badge = ?';
    params.push(req.query.badge);
  }
  if (req.query.search) {
    query += ' AND (title LIKE ? OR location LIKE ? OR description LIKE ?)';
    const s = `%${req.query.search}%`;
    params.push(s, s, s);
  }

  // Sorting
  if (req.query.sort === 'price-asc') query += ' ORDER BY price ASC';
  else if (req.query.sort === 'price-desc') query += ' ORDER BY price DESC';
  else if (req.query.sort === 'beds-desc') query += ' ORDER BY beds DESC';
  else if (req.query.sort === 'sqft-desc') query += ' ORDER BY sqft DESC';
  else query += ' ORDER BY id DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(parseProperty));
});

// Get single property (public)
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Property not found' });
  res.json(parseProperty(row));
});

// Create property (admin)
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { title, location, price, beds, baths, sqft, type, status, badge, image, images, description, amenities } = req.body;

  if (!title || !location || !price || beds === undefined || baths === undefined || !sqft || !type) {
    return res.status(400).json({ error: 'Missing required fields (title, location, price, beds, baths, sqft, type)' });
  }

  const result = db.prepare(`
    INSERT INTO properties (title, location, price, beds, baths, sqft, type, status, badge, image, images, description, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, location, price, beds, baths, sqft, type,
    status || 'For Sale',
    badge || null,
    image || '',
    JSON.stringify(images || []),
    description || '',
    JSON.stringify(amenities || [])
  );

  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseProperty(row));
});

// Update property (admin)
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Property not found' });

  const fields = ['title', 'location', 'price', 'beds', 'baths', 'sqft', 'type', 'status', 'badge', 'image', 'description'];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (req.body.images !== undefined) {
    updates.push('images = ?');
    values.push(JSON.stringify(req.body.images));
  }
  if (req.body.amenities !== undefined) {
    updates.push('amenities = ?');
    values.push(JSON.stringify(req.body.amenities));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  db.prepare(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  res.json(parseProperty(row));
});

// Delete property (admin)
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Property not found' });

  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.json({ message: 'Property deleted' });
});

export default router;
