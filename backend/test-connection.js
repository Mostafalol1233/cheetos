import dns from 'dns';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pkg;

const hostname = 'db.enzhpcamsryehittbwuf.supabase.co';

console.log('--- Diagnostic Start ---');
console.log(`Checking DNS for: ${hostname}`);

dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.error('❌ DNS Lookup Failed:', err.code, err.message);
  } else {
    console.log(`✅ DNS Resolved: ${address} (IPv${family})`);
  }

  console.log('\nChecking Database Connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')); // Hide password

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  pool.connect()
    .then(client => {
      console.log('✅ Database Connection Successful!');
      return client.query('SELECT NOW()')
        .then(res => {
          console.log('Query Result (Time):', res.rows[0].now);
          client.release();
          pool.end();
        });
    })
    .catch(err => {
      console.error('❌ Database Connection Failed:', err.message);
      if (err.code) console.error('Error Code:', err.code);
      pool.end();
    });
});
