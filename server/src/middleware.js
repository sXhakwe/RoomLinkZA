import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { config } from './config.js';
import { query } from './db/pool.js';
export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await query('SELECT * FROM users WHERE id=$1', [payload.sub]);
    if (!rows[0] || rows[0].status !== 'active') return res.status(401).json({ error: 'Account unavailable' });
    req.user = rows[0]; next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
}
export function notFound(req, res) { res.status(404).json({ error: 'Route not found' }); }
export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
  if (error.code === '23505') return res.status(409).json({ error: 'That record already exists' });
  console.error(error); res.status(500).json({ error: 'Unexpected server error' });
}

