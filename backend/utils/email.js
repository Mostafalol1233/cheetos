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

const STORE_NAME    = 'متجر ضياء السادة';
const STORE_NAME_EN = 'Diaa Sadek Store';
const SITE_URL      = process.env.FRONTEND_URL || 'https://diaasadek.com';
const LOGO_URL      = 'https://res.cloudinary.com/ddzbutb12/image/upload/v1774173479/gamecart/logo.png';
const GOLD          = '#D4AF37';
const GOLD_DARK     = '#b8962e';
const BG_DARK       = '#0d0d0d';
const BG_CARD       = '#161616';
const BG_CARD2      = '#1e1e1e';
const BORDER        = '#2a2a2a';
const TEXT_MAIN     = '#f0f0f0';
const TEXT_MUTED    = '#888888';

const wrap = (body) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${STORE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;width:100%;background:${BG_DARK};border-radius:20px;overflow:hidden;border:1px solid ${BORDER};">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#0d0d0d 100%);padding:32px 24px;text-align:center;border-bottom:2px solid ${GOLD};">
            <img src="${LOGO_URL}" alt="${STORE_NAME}" width="72" height="72"
                 style="border-radius:16px;display:block;margin:0 auto 16px;border:2px solid ${GOLD}30;" />
            <div style="font-size:22px;font-weight:900;color:${GOLD};letter-spacing:1px;">${STORE_NAME}</div>
            <div style="font-size:11px;color:#666;letter-spacing:3px;margin-top:4px;text-transform:uppercase;">${STORE_NAME_EN}</div>
          </td>
        </tr>

        <!-- BODY -->
        ${body}

        <!-- FOOTER -->
        <tr>
          <td style="background:#0a0a0a;padding:24px;text-align:center;border-top:1px solid ${BORDER};">
            <div style="margin-bottom:12px;">
              <a href="${SITE_URL}" style="color:${GOLD};text-decoration:none;font-size:13px;font-weight:600;">${SITE_URL.replace('https://', '')}</a>
            </div>
            <div style="color:#444;font-size:11px;line-height:1.8;">
              © ${new Date().getFullYear()} ${STORE_NAME} — جميع الحقوق محفوظة<br/>
              هذا الإيميل أُرسل تلقائياً، يُرجى عدم الرد عليه مباشرةً<br/>
              للدعم: <a href="mailto:support@diaasadek.com" style="color:${GOLD};text-decoration:none;">support@diaasadek.com</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const statusBadge = (color, bg, text) =>
  `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:700;padding:5px 16px;border-radius:50px;border:1px solid ${color}30;">${text}</span>`;

const detailRow = (label, value, valueColor = TEXT_MAIN) => `
  <tr>
    <td style="padding:10px 0;color:${TEXT_MUTED};font-size:13px;border-bottom:1px solid ${BORDER};width:40%;">${label}</td>
    <td style="padding:10px 0;color:${valueColor};font-size:14px;font-weight:600;border-bottom:1px solid ${BORDER};text-align:left;" dir="ltr">${value}</td>
  </tr>`;

const ctaButton = (href, label, color = GOLD, textColor = '#000') => `
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${color},${GOLD_DARK});color:${textColor};padding:14px 36px;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.5px;">${label}</a>
  </div>`;

const templates = {

  orderConfirmation: (order) => {
    const name  = order.customer_name || order.customerName || 'عميلنا العزيز';
    const oid   = order.id || '—';
    const total = order.total || order.total_amount || '—';
    const pm    = order.payment_method || order.paymentMethod || '—';
    const pid   = order.player_id || null;
    const game  = order.game_name || order.gameName || null;
    const pkg   = order.package_name || order.packageName || null;

    return {
      subject: `✅ تم استلام طلبك #${oid} — ${STORE_NAME}`,
      text: `أهلاً ${name}، تم استلام طلبك #${oid} بنجاح. الإجمالي: ${total} جنيه. جاري المراجعة.`,
      html: wrap(`
        <tr><td style="padding:32px 28px;direction:rtl;text-align:right;">

          <!-- Greeting -->
          <p style="font-size:17px;color:${TEXT_MAIN};margin:0 0 6px;">
            أهلاً <strong style="color:${GOLD};">${name}</strong> 👋
          </p>
          <p style="font-size:14px;color:${TEXT_MUTED};margin:0 0 28px;line-height:1.7;">
            شكراً لثقتك في ${STORE_NAME}! تم استلام طلبك بنجاح وهو الآن قيد المراجعة من فريقنا.
            ستصلك رسالة أخرى فور تأكيد الدفع وتجهيز طلبك.
          </p>

          <!-- Status Banner -->
          <div style="background:linear-gradient(135deg,#1a1400,#1e1800);border:1px solid ${GOLD}40;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
            <div style="font-size:13px;color:${TEXT_MUTED};margin-bottom:8px;">حالة الطلب</div>
            ${statusBadge('#fbbf24', 'rgba(251,191,36,0.12)', '⏳ قيد المراجعة')}
            <div style="font-size:12px;color:#666;margin-top:10px;">سيتم التحقق من الدفع وتنفيذ الطلب قريباً</div>
          </div>

          <!-- Order Details -->
          <div style="background:${BG_CARD};border:1px solid ${BORDER};border-radius:14px;padding:20px;margin-bottom:24px;">
            <div style="font-size:13px;font-weight:700;color:${GOLD};margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid ${BORDER};">📋 تفاصيل الطلب</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${detailRow('رقم الطلب', `#${oid}`, GOLD)}
              ${game  ? detailRow('اللعبة', game) : ''}
              ${pkg   ? detailRow('الباقة', pkg) : ''}
              ${pid   ? detailRow('Player ID', pid) : ''}
              ${detailRow('طريقة الدفع', pm)}
              ${detailRow('الإجمالي', `${total} جنيه`, GOLD)}
            </table>
          </div>

          <!-- Info Box -->
          <div style="background:${BG_CARD2};border-right:4px solid ${GOLD};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.8;">
              📌 <strong style="color:${TEXT_MAIN};">ملاحظة:</strong>
              يتم التحقق من الدفع يدوياً خلال دقائق معدودة. لأي استفسار تواصل معنا عبر
              <strong style="color:${GOLD};">واتساب</strong> أو راسلنا على
              <a href="mailto:support@diaasadek.com" style="color:${GOLD};text-decoration:none;">support@diaasadek.com</a>
            </p>
          </div>

          ${ctaButton(`${SITE_URL}/profile`, '📦 تتبع طلبك')}

        </td></tr>
      `)
    };
  },

  orderStatusUpdate: (order) => {
    const name   = order.customer_name || order.customerName || 'عميلنا العزيز';
    const oid    = order.id || '—';
    const status = order.status || '—';

    const isConfirmed = String(status).toLowerCase().includes('confirm') || String(status).includes('مؤكد') || String(status).includes('تم');
    const badgeEl = isConfirmed
      ? statusBadge('#4ade80', 'rgba(74,222,128,0.12)', '✅ تم تأكيد الدفع')
      : statusBadge('#60a5fa', 'rgba(96,165,250,0.12)', `🔄 ${status}`);

    return {
      subject: `🔔 تحديث على طلبك #${oid} — ${STORE_NAME}`,
      text: `أهلاً ${name}، تم تحديث حالة طلبك #${oid}. الحالة الجديدة: ${status}.`,
      html: wrap(`
        <tr><td style="padding:32px 28px;direction:rtl;text-align:right;">

          <p style="font-size:17px;color:${TEXT_MAIN};margin:0 0 6px;">
            أهلاً <strong style="color:${GOLD};">${name}</strong>،
          </p>
          <p style="font-size:14px;color:${TEXT_MUTED};margin:0 0 28px;line-height:1.7;">
            لديك تحديث جديد على طلبك رقم <strong style="color:${TEXT_MAIN};">#${oid}</strong>
          </p>

          <!-- Status -->
          <div style="background:linear-gradient(135deg,#0f1a0f,#111811);border:1px solid #1a3d1a;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
            <div style="font-size:13px;color:${TEXT_MUTED};margin-bottom:12px;">الحالة الحالية لطلبك</div>
            ${badgeEl}
            <div style="font-size:13px;color:#aaa;margin-top:14px;line-height:1.7;">
              ${isConfirmed ? 'تم تأكيد دفعك بنجاح! يتم الآن تجهيز طلبك وسيصلك التسليم قريباً.' : `حالة طلبك الحالية: <strong style="color:#fff;">${status}</strong>`}
            </div>
          </div>

          <!-- Order Ref -->
          <div style="background:${BG_CARD};border:1px solid ${BORDER};border-radius:14px;padding:20px;margin-bottom:24px;text-align:center;">
            <div style="font-size:12px;color:${TEXT_MUTED};margin-bottom:6px;">رقم مرجعي</div>
            <div style="font-size:20px;font-weight:900;color:${GOLD};letter-spacing:2px;">#${oid}</div>
          </div>

          ${ctaButton(`${SITE_URL}/profile`, '📋 عرض تفاصيل الطلب')}

        </td></tr>
      `)
    };
  },

  orderDelivery: (order) => {
    const name    = order.customer_name || order.customerName || 'عميلنا العزيز';
    const oid     = order.id || '—';
    const total   = order.total || order.total_amount || '—';
    const msg     = order.delivery_message || null;
    const game    = order.game_name || order.gameName || null;
    const pkg     = order.package_name || order.packageName || null;

    return {
      subject: `🎮 تم تسليم طلبك #${oid} — ${STORE_NAME}`,
      text: `أهلاً ${name}، تم تسليم طلبك #${oid} بنجاح! ${msg || ''}`,
      html: wrap(`
        <tr><td style="padding:32px 28px;direction:rtl;text-align:right;">

          <!-- Success Banner -->
          <div style="background:linear-gradient(135deg,#0a1f0a,#0f2310);border:1px solid #1a4d1a;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
            <div style="font-size:40px;margin-bottom:10px;">🎉</div>
            <div style="font-size:20px;font-weight:900;color:#4ade80;margin-bottom:6px;">تم التسليم بنجاح!</div>
            <div style="font-size:13px;color:#aaa;">طلبك رقم <strong style="color:#fff;">#${oid}</strong> جاهز للاستخدام</div>
          </div>

          <p style="font-size:16px;color:${TEXT_MAIN};margin:0 0 6px;">
            أهلاً <strong style="color:${GOLD};">${name}</strong> 🎮
          </p>
          <p style="font-size:14px;color:${TEXT_MUTED};margin:0 0 24px;line-height:1.7;">
            يسعدنا إعلامك بأن طلبك تم تسليمه بنجاح. يمكنك الآن الاستمتاع بشحنتك!
          </p>

          <!-- Delivery Message / Code -->
          ${msg ? `
          <div style="background:linear-gradient(135deg,#0c1f0c,#101f10);border:2px solid #22c55e50;border-radius:16px;padding:24px;margin-bottom:24px;">
            <div style="display:flex;align-items:center;margin-bottom:16px;">
              <span style="background:#22c55e20;color:#4ade80;font-size:12px;font-weight:700;padding:4px 12px;border-radius:50px;border:1px solid #22c55e40;">✅ رسالة التسليم</span>
            </div>
            <div style="background:#0d1a0d;border-radius:10px;padding:20px;font-size:15px;color:#f0f0f0;white-space:pre-wrap;line-height:1.9;border:1px solid #1a3d1a;font-family:monospace;">${msg}</div>
          </div>
          ` : ''}

          <!-- Order Summary -->
          <div style="background:${BG_CARD};border:1px solid ${BORDER};border-radius:14px;padding:20px;margin-bottom:24px;">
            <div style="font-size:13px;font-weight:700;color:${GOLD};margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid ${BORDER};">📋 ملخص الطلب</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${detailRow('رقم الطلب', `#${oid}`, GOLD)}
              ${game  ? detailRow('اللعبة', game) : ''}
              ${pkg   ? detailRow('الباقة', pkg) : ''}
              ${detailRow('المبلغ المدفوع', `${total} جنيه`, '#4ade80')}
              ${detailRow('الحالة', '✅ مُسلَّم', '#4ade80')}
            </table>
          </div>

          <!-- Thank you -->
          <div style="background:${BG_CARD2};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="color:${TEXT_MUTED};font-size:13px;margin:0 0 6px;">🙏 شكراً لثقتك في ${STORE_NAME}</p>
            <p style="color:#555;font-size:12px;margin:0;">نتمنى أن تكون تجربتك معنا رائعة — نراك مجدداً!</p>
          </div>

          ${ctaButton(`${SITE_URL}/games`, '🎮 تصفح المزيد من الألعاب')}

        </td></tr>
      `)
    };
  }
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
      from: `"${STORE_NAME} | ${STORE_NAME_EN}" <${process.env.SMTP_FROM || 'support@diaasadek.com'}>`,
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

  const deliveryHtml = html || wrap(`
    <tr><td style="padding:32px 28px;direction:rtl;text-align:right;">
      <p style="font-size:16px;color:${TEXT_MAIN};margin:0 0 20px;">
        رسالة من فريق <strong style="color:${GOLD};">${STORE_NAME}</strong>
      </p>
      <div style="background:${BG_CARD};border:1px solid ${BORDER};border-right:4px solid ${GOLD};border-radius:12px;padding:24px;font-size:15px;color:${TEXT_MAIN};white-space:pre-wrap;line-height:1.9;">
        ${String(text || '')}
      </div>
      <p style="font-size:13px;color:${TEXT_MUTED};margin-top:20px;text-align:center;">
        للرد أو الاستفسار راسلنا على
        <a href="mailto:support@diaasadek.com" style="color:${GOLD};text-decoration:none;">support@diaasadek.com</a>
      </p>
    </td></tr>
  `);

  try {
    const info = await transporter.sendMail({
      from: `"${STORE_NAME} | ${STORE_NAME_EN}" <${process.env.SMTP_FROM || 'support@diaasadek.com'}>`,
      to,
      subject: String(subject || `📩 رسالة من ${STORE_NAME}`),
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
