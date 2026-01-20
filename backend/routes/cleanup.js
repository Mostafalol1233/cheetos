import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Backup and Prune Orders
router.post('/prune-orders', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { days = 90, status } = req.body;
    const result = await pruneOrders(days, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Internal function to prune orders
async function pruneOrders(days = 90, status = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let selectQuery = "SELECT * FROM orders WHERE created_at < NOW() - INTERVAL '1 day' * $1";
    const params = [days];
    
    if (status) {
      selectQuery += " AND status = $2";
      params.push(status);
    } else {
      // If no status specified, only prune final states or very old pending
      // For safety, let's default to only pruning 'cancelled' and 'rejected' if no status given
      // unless days is very large (e.g. > 365)
      if (days < 365) {
        selectQuery += " AND status IN ('cancelled', 'rejected')";
      }
    }
    
    const rows = await client.query(selectQuery, params);
    
    if (rows.rows.length === 0) {
      await client.query('ROLLBACK');
      return { message: 'No orders to prune', count: 0 };
    }
    
    // Backup
    const backupDir = path.join(process.cwd(), 'backups', 'orders');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `orders_backup_${dateStr}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(rows.rows, null, 2));
    
    // Delete
    const ids = rows.rows.map(r => r.id);
    // Use chunks if too many ids, but for now ANY($1) is okay for reasonable amounts
    await client.query("DELETE FROM orders WHERE id = ANY($1)", [ids]);
    
    await client.query('COMMIT');
    
    return { 
      message: `Pruned ${rows.rows.length} orders. Backup saved.`, 
      count: rows.rows.length, 
      backup: backupFile 
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Scheduled Cleanup (Runs once a day)
export function startCleanupSchedule() {
  // Run every 24 hours
  setInterval(async () => {
    try {
      console.log('Running automated order cleanup...');
      // Auto-prune cancelled/rejected orders older than 30 days
      const result = await pruneOrders(30, null); // null defaults to cancelled/rejected inside function
      if (result.count > 0) {
        console.log(result.message);
      }
    } catch (err) {
      console.error('Automated cleanup failed:', err.message);
    }
  }, 24 * 60 * 60 * 1000);
}

export default router;
