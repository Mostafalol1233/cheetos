import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Brevo SMTP Config
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

// Email Templates
const templates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmation #${order.id}`,
    text: `Thank you for your order! Order ID: ${order.id}. Total: ${order.total} ${order.currency || 'EGP'}. Track here: ${process.env.FRONTEND_URL}/track-order/${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${order.customerName || order.customer_name}</strong>,</p>
          <p style="color: #666;">Thank you for your purchase. We've received your order and are getting it ready!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> ${order.total || order.total_amount} ${order.currency || 'EGP'}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || order.payment_method}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">${order.status || 'Pending'}</span></p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a>
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
    subject: `Order Update #${order.id}`,
    text: `Your order #${order.id} status has been updated to: ${order.status}.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2196F3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Status Update</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${order.customerName || order.customer_name}</strong>,</p>
          <p style="color: #666;">The status of your order has changed.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
            <p style="margin: 5px 0; font-size: 18px;">New Status: <span style="color: #2196F3; font-weight: bold;">${order.status}</span></p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order</a>
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
  
  if (!process.env.BREVO_USER || !process.env.BREVO_PASS) {
    console.warn('⚠️ Brevo credentials missing, skipping email.');
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
