import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Brevo SMTP Config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email Templates
const templates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmation #${order.id} | تأكيد الطلب`,
    text: `Thank you for your order! Order ID: ${order.id}. Total: ${order.total} ${order.currency || 'EGP'}. Track here: ${process.env.FRONTEND_URL}/track-order/${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; direction: ltr;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
          <h2 style="color: white; margin: 5px 0 0; font-size: 18px;">تم تأكيد الطلب</h2>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${order.customerName || order.customer_name}</strong>,</p>
          <p style="color: #666;">Thank you for your purchase. We've received your order and are getting it ready!</p>
          <p style="color: #666; direction: rtl; text-align: right;">شكراً لشرائك. لقد تلقينا طلبك ونحن نجهزه لك!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Details / تفاصيل الطلب</h3>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
            <p style="margin: 5px 0;"><strong>Total / الإجمالي:</strong> ${order.total || order.total_amount} ${order.currency || 'EGP'}</p>
            <p style="margin: 5px 0;"><strong>Payment / الدفع:</strong> ${order.paymentMethod || order.payment_method}</p>
            <p style="margin: 5px 0;"><strong>Status / الحالة:</strong> <span style="color: #4CAF50; font-weight: bold;">${order.status || 'Pending'}</span></p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order / تتبع طلبك</a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">Or use this ID on the tracking page: <strong>${order.id}</strong></p>
        </div>
        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          &copy; ${new Date().getFullYear()} GameCart. All rights reserved.
        </div>
      </div>
    `
  }),
  orderStatusUpdate: (order) => ({
    subject: `Order Update #${order.id} | تحديث حالة الطلب`,
    text: `Your order #${order.id} status has been updated to: ${order.status}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; direction: ltr;">
        <div style="background-color: #2196F3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Status Update</h1>
          <h2 style="color: white; margin: 5px 0 0; font-size: 18px;">تحديث الحالة</h2>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${order.customerName || order.customer_name}</strong>,</p>
          <p style="color: #666;">The status of your order has changed.</p>
          <p style="color: #666; direction: rtl; text-align: right;">لقد تغيرت حالة طلبك.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
            <p style="margin: 5px 0; font-size: 18px;">New Status / الحالة الجديدة: <span style="color: #2196F3; font-weight: bold;">${order.status}</span></p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order / عرض الطلب</a>
          </div>
        </div>
        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          &copy; ${new Date().getFullYear()} GameCart. All rights reserved.
        </div>
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
    console.warn('⚠️ SMTP credentials missing, skipping email.');
    return false;
  }

  const templateFn = templates[templateName];
  if (!templateFn) {
    console.error(`❌ Template ${templateName} not found.`);
    return false;
  }

  const { subject, text, html } = templateFn(data);

  try {
    const info = await transporter.sendMail({
      from: '"GameCart" <no-reply@gamecart.com>',
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
    const info = await transporter.sendMail({
      from: '"GameCart" <no-reply@gamecart.com>',
      to,
      subject: String(subject || ''),
      text: String(text || ''),
      html: html ? String(html) : undefined
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};
