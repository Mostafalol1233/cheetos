import pool from '../db.js';

const updateSchema = async () => {
  try {
    console.log('Updating chat schema...');
    
    // Create chat_sessions table to track conversation metadata
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'normal',
        assigned_to TEXT,
        user_info JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_message_at TIMESTAMP DEFAULT NOW(),
        unread_count INTEGER DEFAULT 0
      );
    `);

    // Ensure chat_messages table exists (basic schema if missing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        message_encrypted TEXT,
        read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add new columns to chat_messages for attachments and OTV
    await pool.query(`
      ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_type TEXT,
      ADD COLUMN IF NOT EXISTS is_one_time_view BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reply_to TEXT;
    `);
    
    // Populate chat_sessions from existing chat_messages if empty
    // This ensures existing chats appear in the new session tracking
    const { rows: sessions } = await pool.query('SELECT COUNT(*) FROM chat_sessions');
    if (parseInt(sessions[0].count) === 0) {
      console.log('Migrating existing sessions...');
      await pool.query(`
        INSERT INTO chat_sessions (id, last_message_at, unread_count)
        SELECT 
          session_id, 
          MAX(timestamp),
          SUM(CASE WHEN read = false THEN 1 ELSE 0 END)
        FROM chat_messages
        GROUP BY session_id
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_message_at DESC);
    `);

    console.log('Schema updated successfully');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    process.exit(0);
  }
};

updateSchema();
