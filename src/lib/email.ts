import dbConnect from '@/lib/db';
import env from '@/lib/env';
import Settings from '@/models/Settings';
import nodemailer from 'nodemailer';

const getEmailConfig = async () => {
    await dbConnect();
    const settings = await Settings.findOne();

    // DB settings
    const dbHost = settings?.smtpHost;
    const dbPort = settings?.smtpPort;
    const dbUser = settings?.smtpUser;
    const dbPass = settings?.smtpPass;
    const dbFrom = settings?.smtpFrom;

    // Determine credentials (DB > ENV)
    const host = dbHost || env.SMTP_HOST;
    const port = dbPort || parseInt(env.SMTP_PORT);
    const user = dbUser || env.SMTP_USER;
    const pass = dbPass || env.SMTP_PASS;
    const from = dbFrom || env.EMAIL_FROM;

    // Check if secure is needed based on port
    const secure = port === 465 || env.SMTP_SECURE;

    // If completely missing credentials, return null
    if (!host || !user || !pass) {
        return { transporter: null, from: null, isConfigured: false };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });

    return { transporter, from, settings, isConfigured: true };
};

export const sendOTPEmail = async (email: string, otp: string) => {
    const { transporter, from, settings, isConfigured } = await getEmailConfig();
    const brandName = settings?.brandName || 'Store';
    const contactEmail = settings?.contactEmail || 'info@ccloudlab.com';

    // If no SMTP credentials, log to console for development
    if (!isConfigured || !transporter) {
        console.warn('=========================================');
        console.warn('WARNING: SMTP credentials not configured.');
        console.warn(`OTP for ${email}: ${otp}`);
        console.warn('=========================================');
        return { success: true, message: 'OTP logged to console (Dev Mode)' };
    }

    const mailOptions = {
        from: from as string,
        to: email,
        replyTo: contactEmail,
        subject: `Verification Code for Your ${brandName} Account`,
        text: `Your verification code is: ${otp}. It will expire in 10 minutes. If you have any questions, please contact us at ${contactEmail}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Verification Code</h2>
                <p>Hello,</p>
                <p>Thank you for registering at <strong>${brandName}</strong>. Please use the following code to verify your email address. This code will expire in 10 minutes.</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; text-align: center;">If you have any questions, please contact us at <a href="mailto:${contactEmail}" style="color: #2563eb; text-decoration: none;">${contactEmail}</a></p>
                <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error };
    }
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
    const { transporter, from, settings, isConfigured } = await getEmailConfig();
    const brandName = settings?.brandName || 'Store';
    const contactEmail = settings?.contactEmail || 'info@ccloudlab.com';

    // If no SMTP credentials, log to console for development
    if (!isConfigured || !transporter) {
        console.warn('=========================================');
        console.warn('WARNING: SMTP credentials not configured.');
        console.warn(`Password Reset OTP for ${email}: ${otp}`);
        console.warn('=========================================');
        return { success: true, message: 'OTP logged to console (Dev Mode)' };
    }

    const mailOptions = {
        from: from as string,
        to: email,
        replyTo: contactEmail,
        subject: `Password Reset Request - ${brandName}`,
        text: `You requested to reset your password. Your verification code is: ${otp}. It will expire in 10 minutes. If you have any questions, please contact us at ${contactEmail}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password at <strong>${brandName}</strong>. Please use the following code to proceed with the reset. This code will expire in 10 minutes.</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; text-align: center;">If you did not request a password reset, please ignore this email.</p>
                <p style="color: #6b7280; font-size: 14px; text-align: center;">If you have any questions, please contact us at <a href="mailto:${contactEmail}" style="color: #2563eb; text-decoration: none;">${contactEmail}</a></p>
                <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Password reset email error:', error);
        return { success: false, error };
    }
};

export const sendMarketingEmail = async (email: string, subject: string, message: string, recipientName: string = '', productLink: string = '') => {
    const { transporter, from, settings, isConfigured } = await getEmailConfig();
    const brandName = settings?.brandName || 'Store';

    // If no SMTP credentials, log to console for development
    if (!isConfigured || !transporter) {
        console.warn('=========================================');
        console.warn('WARNING: SMTP credentials not configured.');
        console.warn(`Marketing Email to ${email} (Name: ${recipientName})`);
        console.warn(`Subject: ${subject}`);
        console.warn(`Message: ${message}`);
        console.warn(`Product Link: ${productLink}`);
        console.warn('=========================================');
        return { success: true, message: 'Marketing email logged to console (Dev Mode)' };
    }

    // Replace "{name}" placeholders in message with actual name or "Valued Customer" if empty
    const personalizedMessage = message.replace(/{name}/g, recipientName || 'Valued Customer');

    // Format message lines into HTML paragraphs
    const formattedHtmlMessage = personalizedMessage
        .split('\n')
        .map(line => line.trim() ? `<p style="color: #4b5563; line-height: 1.6; font-size: 16px;">${line}</p>` : '<br/>')
        .join('');

    const mailOptions = {
        from: from as string,
        to: email,
        replyTo: from as string,
        subject: subject,
        text: personalizedMessage,
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0;">${brandName}</h1>
                </div>

                <div style="background-color: #ffffff; padding: 0 20px;">
                    ${formattedHtmlMessage}
                </div>
                
                ${productLink ? `
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${productLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Check It Out
                    </a>
                </div>
                ` : ''}

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">You are receiving this email because you subscribed to our newsletter.</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Marketing email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Marketing email error:', error);
        return { success: false, error };
    }
};

export const sendOrderConfirmationEmail = async (order: any) => {
    const { transporter, from, settings, isConfigured } = await getEmailConfig();
    const brandName = settings?.brandName || 'Store';
    const contactEmail = settings?.contactEmail || 'info@ccloudlab.com';
    const email = order.customerInfo.email;

    if (!email) return { success: false, message: 'No email provided' };

    // If no SMTP credentials, log to console for development
    if (!isConfigured || !transporter) {
        console.warn('=========================================');
        console.warn('WARNING: SMTP credentials not configured.');
        console.warn(`Order Confirmation for ${email}: ${order.orderId}`);
        console.warn('=========================================');
        return { success: true, message: 'Order email logged to console (Dev Mode)' };
    }

    const formatPrice = (price: number) => `BDT ${price.toFixed(0)}`;

    const itemsHtml = order.products.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title} x ${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    const mailOptions = {
        from: from as string,
        to: email,
        replyTo: contactEmail,
        subject: `Order Confirmation - ${order.orderId} - ${brandName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #111; margin: 0;">${brandName}</h1>
                    <p style="color: #666;">Thank you for your order!</p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="font-size: 18px; margin-top: 0;">Order Summary</h2>
                    <p><strong>Order ID:</strong> ${order.orderId}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">Subtotal</td>
                            <td style="padding: 10px; text-align: right;">${formatPrice(order.subtotal)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold;">Shipping</td>
                            <td style="padding: 10px; text-align: right;">${formatPrice(order.shippingCost)}</td>
                        </tr>
                        ${order.discountAmount > 0 ? `
                        <tr>
                            <td style="padding: 10px; font-weight: bold; color: #dc2626;">Discount</td>
                            <td style="padding: 10px; text-align: right; color: #dc2626;">-${formatPrice(order.discountAmount)}</td>
                        </tr>
                        ` : ''}
                        <tr style="font-size: 18px; font-weight: bold; border-top: 2px solid #333;">
                            <td style="padding: 10px;">Total</td>
                            <td style="padding: 10px; text-align: right; color: #2563eb;">${formatPrice(order.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 18px;">Shipping Address</h2>
                    <p style="margin: 5px 0;">${order.customerInfo.name}</p>
                    <p style="margin: 5px 0;">${order.customerInfo.phone}</p>
                    <p style="margin: 5px 0;">${order.customerInfo.address}</p>
                    <p style="margin: 5px 0;">${order.customerInfo.city || ''}</p>
                </div>

                <div style="text-align: center; margin: 40px 0; padding: 25px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 15px 0; font-weight: bold; color: #0f172a; font-size: 16px;">Need Help with your Order?</p>
                    <div style="margin-bottom: 15px;">
                        <a href="tel:01518792168" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin: 5px; min-width: 180px;">
                            📞 Call: 01518792168
                        </a>
                        ${settings?.whatsapp ? `
                        <a href="https://wa.me/${settings.whatsapp.replace(/\D/g, '')}" style="background-color: #25d366; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin: 5px; min-width: 180px;">
                            💬 WhatsApp Us
                        </a>
                        ` : ''}
                    </div>
                    <p style="margin: 0; color: #64748b; font-size: 12px;">We're available to assist you with any questions.</p>
                </div>

                <div style="text-align: center; color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                    <p>If you have any questions, please contact us at <a href="mailto:${contactEmail}" style="color: #2563eb; text-decoration: none;">${contactEmail}</a></p>
                    <p>&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Order email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Order email error:', error);
        return { success: false, error };
    }
};
