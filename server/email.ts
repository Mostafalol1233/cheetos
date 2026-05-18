import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"${process.env.APP_NAME || "Diaa Gaming Store"}" <${process.env.SMTP_FROM || "support@diaasadek.com"}>`;

export async function sendOrderConfirmationEmail(opts: {
  to: string;
  customerName: string;
  orderId: string;
  items: any[];
  totalAmount: string | number;
  paymentMethod: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured, skipping order confirmation email");
    return;
  }

  const itemRows = opts.items
    .map(
      (item: any) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #222;">${item.name || item.game || "Item"}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #222;text-align:center;">${item.quantity || 1}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #222;text-align:right;">${item.price || ""} EGP</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#d946a8,#7c3aed);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;">Order Confirmed! 🎮</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Thank you, ${opts.customerName}!</p>
    </div>
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px;color:#ccc;font-size:15px;">
        We've received your order and it's being processed. You'll hear from us shortly.
      </p>

      <div style="background:#0f0f1e;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
        <p style="margin:0;color:#fff;font-size:14px;font-family:monospace;">ID: ${opts.orderId}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#0f0f1e;">
            <th style="padding:8px 12px;text-align:left;color:#aaa;font-size:12px;text-transform:uppercase;">Item</th>
            <th style="padding:8px 12px;text-align:center;color:#aaa;font-size:12px;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 12px;text-align:right;color:#aaa;font-size:12px;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody style="color:#e0e0e0;font-size:14px;">
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#fff;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#d946a8;font-size:16px;">${opts.totalAmount} EGP</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#0f0f1e;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;color:#aaa;font-size:13px;">Payment Method: <span style="color:#fff;">${opts.paymentMethod}</span></p>
      </div>

      <p style="margin:0;color:#888;font-size:13px;text-align:center;">
        Need help? Contact us anytime — we're here for you.
      </p>
    </div>
    <div style="background:#0a0a1a;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#555;font-size:12px;">&copy; ${new Date().getFullYear()} Diaa Gaming Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: `✅ Order Confirmed — ${opts.orderId}`,
      html,
    });
    console.log(`[Email] Order confirmation sent to ${opts.to}`);
  } catch (err) {
    console.error("[Email] Failed to send order confirmation:", err);
  }
}

export async function sendNewAccountEmail(opts: {
  to: string;
  customerName: string;
  username: string;
  password: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured, skipping new account email");
    return;
  }

  const siteUrl = process.env.FRONTEND_URL || "https://diaasadek.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#d946a8,#7c3aed);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;">Welcome to Diaa Gaming Store! 🎮</h1>
    </div>
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px;color:#ccc;font-size:15px;">
        Hi <b style="color:#fff;">${opts.customerName}</b>, an account was automatically created for you so you can track your orders.
      </p>

      <div style="background:#0f0f1e;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</p>
        <p style="margin:0 0 8px;font-size:15px;">🔐 <b style="color:#fff;">Username:</b> <span style="color:#d946a8;font-family:monospace;">${opts.username}</span></p>
        <p style="margin:0;font-size:15px;">🔑 <b style="color:#fff;">Password:</b> <span style="color:#d946a8;font-family:monospace;">${opts.password}</span></p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${siteUrl}/auth"
           style="display:inline-block;background:linear-gradient(135deg,#d946a8,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
          Sign In to Your Account
        </a>
      </div>

      <p style="margin:0;color:#888;font-size:13px;text-align:center;">
        We recommend changing your password after your first login.
      </p>
    </div>
    <div style="background:#0a0a1a;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#555;font-size:12px;">&copy; ${new Date().getFullYear()} Diaa Gaming Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: "🎮 Your Diaa Gaming Store Account",
      html,
    });
    console.log(`[Email] New account credentials sent to ${opts.to}`);
  } catch (err) {
    console.error("[Email] Failed to send account email:", err);
  }
}

export async function sendOrderCodeEmail(opts: {
  to: string;
  customerName: string;
  orderId: string;
  code: string;
  codeType: "text" | "image";
  imageUrl?: string;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP not configured, skipping order code email");
    return;
  }

  const isImage = opts.codeType === "image" && opts.imageUrl;

  const codeSection = isImage
    ? `<div style="text-align:center;margin:24px 0;">
        <p style="margin:0 0 12px;color:#aaa;font-size:13px;text-transform:uppercase;letter-spacing:1px;">كود الطلب</p>
        <img src="${opts.imageUrl}" alt="كود الطلب" style="max-width:100%;border-radius:10px;border:2px solid #d946a8;" />
      </div>`
    : `<div style="background:#0f0f1e;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">الكود الخاص بك</p>
        <p style="margin:0;font-size:28px;font-family:monospace;font-weight:bold;color:#d946a8;letter-spacing:4px;">${opts.code}</p>
      </div>`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#f0f0f0;direction:rtl;">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#d946a8,#7c3aed);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;">تم اعتماد طلبك! 🎮</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">أهلاً ${opts.customerName}، طلبك جاهز!</p>
    </div>
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px;color:#ccc;font-size:15px;">
        تم مراجعة طلبك واعتماده. إليك الكود الخاص بك:
      </p>

      <div style="background:#0f0f1e;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">رقم الطلب</p>
        <p style="margin:0;color:#fff;font-size:14px;font-family:monospace;">${opts.orderId}</p>
      </div>

      ${codeSection}

      <p style="margin:24px 0 0;color:#888;font-size:13px;text-align:center;">
        هل تحتاج مساعدة؟ تواصل معنا في أي وقت.
      </p>
    </div>
    <div style="background:#0a0a1a;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#555;font-size:12px;">&copy; ${new Date().getFullYear()} Diaa Gaming Store. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: `✅ كودك جاهز — طلب رقم ${opts.orderId}`,
      html,
    });
    console.log(`[Email] Order code sent to ${opts.to} for order ${opts.orderId}`);
  } catch (err) {
    console.error("[Email] Failed to send order code email:", err);
  }
}
