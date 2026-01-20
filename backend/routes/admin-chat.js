import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import { getIO } from '../socket.js';

const router = express.Router();

// Get active chat sessions (users who have sent messages)
router.get('/sessions', authenticateToken, ensureAdmin, async (req, res) => {
    try {
        const query = `
      SELECT DISTINCT ON (m.session_id)
        m.session_id as id,
        u.name,
        u.email,
        u.phone,
        (SELECT COUNT(*) FROM chat_messages WHERE session_id = m.session_id AND read = false AND sender = 'user') as "unreadCount",
        COALESCE(m.message, m.message_encrypted) as "lastMessage",
        m.timestamp as "lastActivity"
      FROM chat_messages m
      LEFT JOIN users u ON m.session_id = u.id
      ORDER BY m.session_id, m.timestamp DESC
    `;

        // Fallback if users table join fails (e.g. anonymous sessions if valid)
        const result = await pool.query(query);

        // Sort by lastActivity descending in JS
        const sessions = result.rows.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

        res.json(sessions);
    } catch (err) {
        console.error('Error fetching chat sessions:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get messages for a specific session
router.get('/:id', authenticateToken, ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, sender, message_encrypted as message, timestamp, read, attachment_url as "attachmentUrl", attachment_type as "attachmentType" FROM chat_messages WHERE session_id = $1 ORDER BY timestamp ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark messages as read
router.put('/:id/read', authenticateToken, ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            "UPDATE chat_messages SET read = true WHERE session_id = $1 AND sender = 'user'",
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send reply
router.post('/:id', authenticateToken, ensureAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { message, attachmentUrl, attachmentType } = req.body;

        if ((!message || !String(message).trim()) && !attachmentUrl) {
            return res.status(400).json({ message: 'Message or attachment required' });
        }

        const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)} `;
        const text = message ? String(message).trim() : '';

        await pool.query(
            'INSERT INTO chat_messages (id, session_id, sender, message_encrypted, read, attachment_url, attachment_type) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [msgId, id, 'admin', text, true, attachmentUrl || null, attachmentType || null]
        );

        const msgPayload = {
            id: msgId,
            sender: 'admin',
            text,
            attachmentUrl,
            attachmentType,
            timestamp: new Date().toISOString()
        };

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                io.to(id).emit('chat_message', msgPayload);
                // Also update admin list
                io.emit('admin_chat_update', { sessionId: id, lastMessage: msgPayload });
            }
        } catch (e) {
            console.error('Socket emit error:', e);
        }

        res.json(msgPayload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
