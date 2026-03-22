import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const storeColor = '#D4AF37';
const storeColorDark = '#b8962e';

const headerHtml = (title, subtitle) => `
  <div style="background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid ${storeColor};">
    <div style="font-size: 28px; font-weight: 900; color: ${storeColor}; letter-spacing: 1px; margin-bottom: 4px;">متجر ضياء</div>
    <div style="font-size: 13px; color: #aaa; letter-spacing: 2px;">DIAA GAMING STORE</div>
    ${title ? `<div style="margin-top: 16px; font-size: 20px; font-weight: bold; color: #fff;">${title}</div>` : ''}
    ${subtitle ? `<div style="font-size: 14px; color: #ccc; margin-top: 4px;">${subtitle}</div>` : ''}
  </div>
`;

const footerHtml = () => `
  <div style="background: #111; padding: 20px; text-align: center; border-top: 1px solid #2a2a2a;">
    <p style="color: #666; font-size: 12px; margin: 0;">
      © ${new Date().getFullYear()} متجر ضياء - Diaa Gaming Store | جميع الحقوق محفوظة
    </p>
    <p style="color: #555; font-size: 11px; margin: 8px 0 0;">
      هذا الإيميل تم إرساله تلقائياً - لا ترد عليه | This email was sent automatically
    </p>
  </div>
`;

const templates = {
  orderConfirmation: (order) => ({
    subject: `✅ تم استلام طلبك #${order.id} | Order Received`,
    text: `شكراً لثقتك في متجر ضياء! رقم طلبك: ${order.id}. الإجمالي: ${order.total || order.total_amount} جنيه. سيتم تنفيذ طلبك في أقرب وقت.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
        ${headerHtml('✅ تم استلام طلبك!', 'Your order has been received')}
        <div style="padding: 30px 24px; direction: rtl; text-align: right;">
          <p style="font-size: 16px; color: #e0e0e0; margin-bottom: 8px;">
            أهلاً <strong style="color: ${storeColor};">${order.customer_name || order.customerName || 'عزيزنا العميل'}</strong>،
          </p>
          <p style="color: #999; font-size: 14px; margin-bottom: 24px;">
            شكراً لثقتك في متجر ضياء! تم استلام طلبك بنجاح وجاري مراجعته.
            سيتم إرسال الكود أو تنفيذ الشحن خلال فترة وجيزة.
          </p>

          <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: ${storeColor}; border-bottom: 1px solid #2a2a2a; padding-bottom: 10px; margin-bottom: 14px;">
              📋 تفاصيل الطلب | Order Details
            </div>
            <table style="width: 100%; font-size: 14px; color: #ccc; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #888;">رقم الطلب</td>
                <td style="padding: 6px 0; font-weight: bold; color: #fff;">${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #888;">الإجمالي</td>
                <td style="padding: 6px 0; font-weight: bold; color: ${storeColor};">${order.total || order.total_amount} جنيه</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #888;">طريقة الدفع</td>
                <td style="padding: 6px 0; color: #fff;">${order.payment_method || order.paymentMethod || '-'}</td>
              </tr>
              ${order.player_id ? `<tr>
                <td style="padding: 6px 0; color: #888;">Player ID</td>
                <td style="padding: 6px 0; color: #fff;">${order.player_id}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #888;">الحالة</td>
                <td style="padding: 6px 0;"><span style="background: #fbbf24/20; color: #fbbf24; padding: 3px 10px; border-radius: 20px; font-size: 12px; background-color: rgba(251,191,36,0.15);">قيد المراجعة</span></td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://gamezio.com'}/profile" 
               style="background: linear-gradient(135deg, ${storeColor}, #b8962e); color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              📦 تتبع طلبك
            </a>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            لأي استفسار تواصل معنا عبر واتساب أو الدعم الفني على الموقع
          </p>
        </div>
        ${footerHtml()}
      </div>
    `
  }),

  orderStatusUpdate: (order) => ({
    subject: `🔔 تحديث على طلبك #${order.id} | Order Update`,
    text: `تحديث على طلبك #${order.id}. الحالة الجديدة: ${order.status}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
        ${headerHtml('🔔 تحديث على طلبك', 'Order Status Update')}
        <div style="padding: 30px 24px; direction: rtl; text-align: right;">
          <p style="font-size: 16px; color: #e0e0e0; margin-bottom: 8px;">
            أهلاً <strong style="color: ${storeColor};">${order.customer_name || order.customerName || 'عزيزنا العميل'}</strong>،
          </p>
          <p style="color: #999; font-size: 14px; margin-bottom: 24px;">
            تم تحديث حالة طلبك رقم <strong style="color: #fff;">${order.id}</strong>
          </p>

          <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 14px; color: #888; margin-bottom: 10px;">الحالة الجديدة</div>
            <div style="font-size: 22px; font-weight: bold; color: ${storeColor};">${order.status}</div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://gamezio.com'}/profile" 
               style="background: linear-gradient(135deg, ${storeColor}, #b8962e); color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              📦 عرض الطلب
            </a>
          </div>
        </div>
        ${footerHtml()}
      </div>
    `
  }),

  orderDelivery: (order) => ({
    subject: `🎮 تم تسليم طلبك #${order.id} | Order Delivered`,
    text: `تم تنفيذ طلبك! ${order.delivery_message || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
        ${headerHtml('🎮 تم تسليم طلبك!', 'Your order has been delivered')}
        <div style="padding: 30px 24px; direction: rtl; text-align: right;">
          <p style="font-size: 16px; color: #e0e0e0; margin-bottom: 8px;">
            أهلاً <strong style="color: ${storeColor};">${order.customer_name || order.customerName || 'عزيزنا العميل'}</strong>،
          </p>
          <p style="color: #999; font-size: 14px; margin-bottom: 24px;">
            🎉 تم تنفيذ طلبك بنجاح! يمكنك الاستمتاع بالشحن الآن.
          </p>

          ${order.delivery_message ? `
          <div style="background: #0f1f0f; border: 1px solid #1a3d1a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: #4ade80; margin-bottom: 12px;">✅ رسالة التسليم</div>
            <div style="font-size: 16px; color: #fff; white-space: pre-wrap; line-height: 1.8;">${order.delivery_message}</div>
          </div>
          ` : ''}

          <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: ${storeColor}; margin-bottom: 12px;">📋 ملخص الطلب</div>
            <table style="width: 100%; font-size: 14px; color: #ccc;">
              <tr>
                <td style="padding: 5px 0; color: #888;">رقم الطلب</td>
                <td style="padding: 5px 0; color: #fff; font-weight: bold;">${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #888;">الإجمالي المدفوع</td>
                <td style="padding: 5px 0; color: ${storeColor}; font-weight: bold;">${order.total || order.total_amount} جنيه</td>
              </tr>
            </table>
          </div>

          <p style="color: #666; font-size: 13px; text-align: center;">
            شكراً لثقتك في متجر ضياء 🙏<br/>
            نرجو أن تتمتع بتجربة الشحن معنا
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'https://gamezio.com'}/games" 
               style="background: linear-gradient(135deg, ${storeColor}, #b8962e); color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              🎮 تصفح المزيد
            </a>
          </div>
        </div>
        ${footerHtml()}
      </div>
    `
  })
};

export const sendEmail = async (to, templateName, data) => {
  if (!to) {
    console.warn('⚠️ No email recipient provided, skipping email.');
    return false;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing, logging email to file.');
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logDir = path.join(process.cwd(), 'backend', 'data');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logFile = path.join(logDir, 'emails.log');
      const logEntry = `[${new Date().toISOString()}] To: ${to} | Template: ${templateName}\n-----------------------------------\n`;
      fs.appendFileSync(logFile, logEntry);
      return true;
    } catch (e) {
      console.error('Failed to log email:', e);
      return false;
    }
  }

  const templateFn = templates[templateName];
  if (!templateFn) {
    console.error(`❌ Template ${templateName} not found.`);
    return false;
  }

  const { subject, text, html } = templateFn(data);

  try {
    const info = await transporter.sendMail({
      from: `"متجر ضياء الدين | Diaa Sadek Store" <${process.env.SMTP_FROM || 'support@diaasadek.com'}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};

export const sendRawEmail = async (to, subject, text, html) => {
  if (!to) {
    console.warn('⚠️ No email recipient provided, skipping email.');
    return false;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing, skipping email.');
    return false;
  }

  try {
    const deliveryHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a;">
        ${headerHtml('رسالة من متجر ضياء', 'Message from Diaa Store')}
        <div style="padding: 30px 24px; direction: rtl; text-align: right;">
          <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; white-space: pre-wrap; color: #e0e0e0; font-size: 15px; line-height: 1.8;">
            ${String(text || '')}
          </div>
        </div>
        ${footerHtml()}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"متجر ضياء الدين | Diaa Sadek Store" <${process.env.SMTP_FROM || 'support@diaasadek.com'}>`,
      to,
      subject: String(subject || '📩 رسالة من متجر ضياء الدين'),
      text: String(text || ''),
      html: deliveryHtml
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};
