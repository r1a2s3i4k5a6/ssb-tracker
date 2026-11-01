// Blocks anyone who is not logged in
function requireLogin(req, res, next) {
  if (!req.session.aspirantId) {
    return res.status(401).json({ error: 'Please log in first' });
  }
  next();
}

// Only the admin account may pass
function requireAdmin(req, res, next) {
  const db = require('./db');
  const u = db.prepare('SELECT is_admin FROM aspirants WHERE id = ?').get(req.session.aspirantId);
  if (!u || !u.is_admin) return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { requireLogin, requireAdmin };
