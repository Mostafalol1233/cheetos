import pool from '../db.js';

export const logAudit = async (action, summary, user) => {
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const userStr = user ? ` (by ${user.email || 'admin'})` : '';
    await pool.query(
      'INSERT INTO admin_audit_logs (id, action, summary) VALUES ($1, $2, $3)',
      [id, action, summary + userStr]
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};
