import { Server } from 'socket.io';
import crypto from 'crypto';
import pool from './db.js';
import jwt from 'jsonwebtoken';

let ioInstance = null;

function encryptMessage(plain) {
  const key = (process.env.PAYMENT_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') });
}

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join_session', async ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(sessionId);
    });

    socket.on('admin_join', (token) => {
      try {
        if (!token) return;
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret);
        if (decoded) {
           socket.data.isAdmin = true;
           socket.join('admin_room');
        }
      } catch (e) {
      }
    });

    socket.on('send_message', async (data) => {
      const { sessionId, sender, text, attachment, replyTo } = data;

      if (!sessionId || !sender || !text) return;

      if ((sender === 'support' || sender === 'admin') && !socket.data.isAdmin) {
        return;
      }
      
      try {
        const encrypted = encryptMessage(text || '');

        const res = await pool.query(`
          INSERT INTO chat_messages 
          (session_id, sender, message_encrypted, read, attachment_url, attachment_type, reply_to, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `, [sessionId, sender, encrypted, false, attachment?.url, attachment?.type, replyTo]);
        
        const msg = res.rows[0];
        const decryptedMsg = {
            id: msg.id,
            sessionId: msg.session_id,
            sender: msg.sender,
            message: text,
            attachmentUrl: msg.attachment_url,
            attachmentType: msg.attachment_type,
            replyTo: msg.reply_to,
            timestamp: new Date(msg.timestamp).getTime(),
            read: false
        };

        const isUser = sender !== 'support' && sender !== 'admin';
        const unreadIncrement = isUser ? 1 : 0;
        
        await pool.query(`
            INSERT INTO chat_sessions (id, last_message_at, unread_count, status)
            VALUES ($1, NOW(), $2, 'open')
            ON CONFLICT (id) DO UPDATE SET 
                last_message_at = NOW(),
                unread_count = chat_sessions.unread_count + $2,
                status = 'open'
        `, [sessionId, unreadIncrement]);

        ioInstance.to(sessionId).emit('new_message', decryptedMsg);
        
        ioInstance.to('admin_room').emit('session_updated', { 
            sessionId, 
            lastMessage: decryptedMsg,
            unreadCount: isUser ? 1 : 0
        });

      } catch (err) {
        console.error('Socket message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ sessionId, sender, isTyping }) => {
        socket.to(sessionId).emit('typing', { sender, isTyping });
    });

    // Mark read
    socket.on('mark_read', async ({ sessionId, role }) => {
        await pool.query('UPDATE chat_messages SET read = true WHERE session_id = $1 AND read = false', [sessionId]);
        
        if (role === 'admin' || role === 'support') {
             await pool.query('UPDATE chat_sessions SET unread_count = 0 WHERE id = $1', [sessionId]);
        }
        
        ioInstance.to(sessionId).emit('messages_read', { sessionId });
        ioInstance.to('admin_room').emit('session_read', { sessionId });
    });
    
    socket.on('disconnect', () => {
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;
