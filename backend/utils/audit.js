import pool from '../db.js';

export const logAudit = async (action, summary, user) => {
  // Audit logging must never break the main request flow (signup/login/etc)
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const userStr = user ? ` (by ${user.email || 'admin'})` : '';

    // If DB is not configured/available, just skip silently.
    if (!pool?.query) return;

    await pool.query(
      'INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)',
      [id, action, summary + userStr]
    );
  } catch (_) {
    // Intentionally swallow errors to avoid 500s during auth
  }
};
