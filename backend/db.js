import pkg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';
import { URL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
if (!process.env.DATABASE_URL) {
  const devEnv = path.join(__dirname, '.env.development');
  const prodEnv = path.join(__dirname, '.env.production');
  if (fs.existsSync(devEnv)) dotenv.config({ path: devEnv });
  if (!process.env.DATABASE_URL && fs.existsSync(prodEnv)) dotenv.config({ path: prodEnv });
}

const { Pool } = pkg;

function buildPoolConfig() {
  const connStr = process.env.DATABASE_URL || '';
  const overrideHost = process.env.PGHOST_IP || '';
  const useObject = Boolean(overrideHost);

  if (useObject && connStr) {
    try {
      const u = new URL(connStr);
      return {
        host: overrideHost,
        port: Number(u.port || process.env.PGPORT || 5432),
        user: decodeURIComponent(u.username || process.env.PGUSER || ''),
        password: decodeURIComponent(u.password || process.env.PGPASSWORD || ''),
        database: (u.pathname || '').replace('/', '') || process.env.PGDATABASE || 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20,
      };
    } catch {
      // Fallback to connectionString if URL parsing fails
    }
  }

  return {
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  };
}

const poolConfig = buildPoolConfig();
let pool = new Pool(poolConfig);

export const setHostOverride = (ip) => {
  if (!ip) return pool;
  const connStr = process.env.DATABASE_URL || '';
  try {
    const u = new URL(connStr);
    const newCfg = {
      host: ip,
      port: Number(u.port || process.env.PGPORT || 5432),
      user: decodeURIComponent(u.username || process.env.PGUSER || ''),
      password: decodeURIComponent(u.password || process.env.PGPASSWORD || ''),
      database: (u.pathname || '').replace('/', '') || process.env.PGDATABASE || 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
    };
    try { pool.end().catch(()=>{}); } catch {}
    pool = new Pool(newCfg);
  } catch {}
  return pool;
};

export const preferIPv4 = async () => {
  const host = (() => { try { return new URL(process.env.DATABASE_URL || '').hostname; } catch { return ''; } })();
  if (!host) return false;
  if (/\.neon\.tech$/i.test(host)) {
    console.log('ℹ️ Neon host detected; keeping domain for SNI handshake');
    return false;
  }
  return new Promise(resolve => {
    dns.resolve4(host, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false);
      } else {
        const ip = addresses[0];
        setHostOverride(ip);
        console.log(`🔁 Using IPv4 for database host: ${ip}`);
        resolve(true);
      }
    });
  });
};

// Event listeners for pool health
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle database client:', err.message);
});

pool.on('connect', () => {
  // console.log('✅ New client connected to database pool');
});

/**
 * Test database connection with retries
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay in ms between retries
 */
export const checkConnection = async (retries = 5, delay = 3000) => {
  const host = process.env.PGHOST || (() => {
    try { return new URL(process.env.DATABASE_URL || '').hostname; } catch { return ''; }
  })();

  if (host) {
    await new Promise(resolve => {
      dns.lookup(host, (err, address, family) => {
        if (err) {
          console.error(`❌ DNS resolution failed for ${host}: ${err.code || ''} ${err.message}`);
        } else {
          console.log(`✅ DNS resolved ${host} → ${address} (IPv${family})`);
        }
        resolve();
      });
    });
  }

  for (let i = 0; i < retries; i++) {
    let client;
    try {
      client = await pool.connect();
      const res = await client.query('SELECT NOW()');
      console.log(`✅ Database connected successfully at ${res.rows[0].now}`);
      client.release();
      return true;
    } catch (err) {
      console.error(`⚠️ Database connection attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (client) client.release();
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ Could not establish database connection after multiple attempts.');
  return false;
};

// Export the pool directly for compatibility
export default pool;
