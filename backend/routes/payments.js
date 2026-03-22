import express from 'express';
import pool from '../db.js';
import { sendRawEmail } from '../utils/email.js';
import { decryptText } from '../utils/crypto.js';
import crypto from 'crypto';

const router = express.Router();

// Get payment configuration
router.get('/config', (req, res) => {
  try {
    const validatePhone = (phone) => /^01[0125][0-9]{8}$/.test(phone);
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    // InstaPay address can be username@instapay or a phone number
    const validateInstapay = (addr) => (addr && addr.includes('@')) || validatePhone(addr);

    const config = [
      {
        id: 'vodafone_cash',
        name: 'Vodafone Cash',
        type: 'wallet',
        enabled: !!(process.env.VODAFONE_CASH_NUMBER || process.env.PAYMENT_VODAFONE_NUMBER),
        details: {
          number: process.env.VODAFONE_CASH_NUMBER || process.env.PAYMENT_VODAFONE_NUMBER || '',
          instructions: process.env.VODAFONE_CASH_INSTRUCTIONS || 'Send the total amount to this Vodafone Cash wallet and upload the transfer receipt.'
        },
        validator: (d) => validatePhone(d.number)
      },
      {
        id: 'instapay',
        name: 'InstaPay',
        type: 'instapay',
        enabled: !!(process.env.INSTAPAY_ACCOUNT || process.env.instapay || process.env.PAYMENT_INSTAPAY_ADDRESS),
        details: {
          address: process.env.INSTAPAY_ACCOUNT || process.env.instapay || process.env.PAYMENT_INSTAPAY_ADDRESS || '',
          instructions: process.env.INSTAPAY_INSTRUCTIONS || 'Send via InstaPay to this address and upload your transfer confirmation.'
        },
        validator: (d) => validateInstapay(d.address)
      },
      {
        id: 'orange_cash',
        name: 'Orange Cash',
        type: 'wallet',
        enabled: !!(process.env.ORANGE_CASH_NUMBER || process.env.PAYMENT_ORANGE_NUMBER),
        details: {
          number: process.env.ORANGE_CASH_NUMBER || process.env.PAYMENT_ORANGE_NUMBER || '',
          instructions: process.env.ORANGE_CASH_INSTRUCTIONS || 'Send the total amount to this Orange Cash wallet and upload the receipt.'
        },
        validator: (d) => validatePhone(d.number)
      },
      {
        id: 'etisalat_cash',
        name: 'Etisalat Cash',
        type: 'wallet',
        enabled: !!(process.env.ETISALAT_CASH_NUMBER || process.env.etisalat_cash || process.env.PAYMENT_ETISALAT_NUMBER),
        details: {
          number: process.env.ETISALAT_CASH_NUMBER || process.env.etisalat_cash || process.env.PAYMENT_ETISALAT_NUMBER || '',
          instructions: process.env.ETISALAT_CASH_INSTRUCTIONS || 'Send the total amount to this Etisalat Cash wallet and upload the receipt.'
        },
        validator: (d) => validatePhone(d.number)
      },
      {
        id: 'we_pay',
        name: 'WePay',
        type: 'wallet',
        enabled: !!(process.env.WE_PAY_NUMBERS || process.env.PAYMENT_WEPAY_NUMBER),
        details: {
          number: process.env.WE_PAY_NUMBERS || process.env.PAYMENT_WEPAY_NUMBER || '',
          instructions: process.env.WE_PAY_INSTRUCTIONS || 'Send the total amount to this WePay wallet and upload the receipt.'
        },
        // WePay might have multiple numbers, so we relax validation to allow non-empty string if it's not a single phone
        validator: (d) => d.number && d.number.length > 5
      },
      {
        id: 'credit_card', // Keeping ID for compatibility, but this is effectively PayPal or CC
        name: 'PayPal / Credit Card',
        type: 'card',
        enabled: !!(process.env.PAYPAL_EMAIL || process.env.paypal || process.env.PAYMENT_PAYPAL_EMAIL),
        details: {
          email: process.env.PAYPAL_EMAIL || process.env.paypal || process.env.PAYMENT_PAYPAL_EMAIL || '',
          instructions: process.env.PAYPAL_INSTRUCTIONS || 'Send payment via PayPal and upload the confirmation screenshot.'
        },
        validator: (d) => validateEmail(d.email)
      }
    ];

    // Filter out disabled methods AND methods that fail validation
    const activeMethods = config.filter(m => {
      if (!m.enabled) return false;
      if (m.validator && !m.validator(m.details)) {
        console.warn(`Payment method ${m.id} is enabled but has invalid configuration details. Disabling.`);
        return false;
      }
      return true;
    }).map(({ validator, ...rest }) => rest); // Remove validator function from response

    res.json(activeMethods);
  } catch (error) {
    console.error('Error fetching payment config:', error);
    res.status(500).json({ message: 'Failed to fetch payment configuration' });
  }
});

// Create a mock payment session (future-proof for real gateway)
router.post('/session', async (req, res) => {
  try {
    const { orderId, amount, currency } = req.body || {};
    if (!orderId || !Number(amount)) return res.status(400).json({ message: 'orderId and amount required' });
    const sessionId = `ps_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    res.json({ id: sessionId, url: `${process.env.FRONTEND_URL || ''}/payment/mock-success?orderId=${encodeURIComponent(orderId)}&sessionId=${sessionId}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirm payment success (mock)
router.post('/confirm', async (req, res) => {
  try {
    // HMAC verification for webhook security
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }
    
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'Missing webhook signature' });
    }
    
    const bodyString = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(bodyString, 'utf8').digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }
    
    const { orderId, game_id, package_name, customer_email } = req.body || {};
    if (!orderId || !game_id || !package_name || !customer_email) return res.status(400).json({ message: 'orderId, game_id, package_name, customer_email required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Mark order paid (best-effort)
      try { await client.query("UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1", [orderId]); } catch {}
      // Select an available code and lock it
      await client.query(`CREATE TABLE IF NOT EXISTS game_card_codes (
        id VARCHAR(60) PRIMARY KEY,
        game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
        package_name TEXT NOT NULL,
        code_encrypted TEXT NOT NULL,
        code_mask TEXT NOT NULL DEFAULT '',
        status VARCHAR(12) DEFAULT 'unused',
        used_order_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )`);
      const pick = await client.query(
        "SELECT id, code_encrypted FROM game_card_codes WHERE game_id = $1 AND package_name = $2 AND status = 'unused' ORDER BY created_at ASC LIMIT 1 FOR UPDATE",
        [String(game_id), String(package_name)]
      );
      if (!pick.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'No available codes' });
      }
      const { id: codeId, code_encrypted } = pick.rows[0];
      // Decrypt code (keep transaction open to hold lock)
      let codePlain = '';
      try { codePlain = decryptText(code_encrypted); } catch (e) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: 'Failed to decrypt code' });
      }
      // Attempt to email BEFORE marking used; if email fails, keep transaction rolled back so code is not consumed
      const ok = await sendRawEmail(
        String(customer_email),
        `Your game card code for ${package_name}`,
        `Code: ${codePlain}`,
        `<div style=\"font-family:sans-serif\">Your code: <strong>${codePlain}</strong></div>`
      );
      if (!ok) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: 'Email delivery failed' });
      }
      // Email succeeded, mark code used and commit
      await client.query(
        "UPDATE game_card_codes SET status = 'used', used_order_id = $1, used_at = NOW() WHERE id = $2",
        [orderId, codeId]
      );
      await client.query('COMMIT');
      return res.json({ ok: true, codeAssigned: true });
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).json({ message: e.message });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
