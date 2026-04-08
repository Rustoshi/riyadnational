import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@example.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || '';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Create transporter instance
let transporter: Transporter | null = null;

/**
 * Get or create the nodemailer transporter for ZeptoMail SMTP
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // ZeptoMail SMTP configuration
  const smtpConfig = {
    host: process.env.ZEPTOMAIL_SMTP_HOST || 'smtp.zeptomail.com',
    port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT || '587'),
    secure: process.env.ZEPTOMAIL_SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.ZEPTOMAIL_SMTP_USER,
      pass: process.env.ZEPTOMAIL_SMTP_PASSWORD,
    },
  };

  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
}

/**
 * Send an email using ZeptoMail SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const {
    to,
    subject,
    html,
    from = `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
    replyTo,
    cc,
    bcc,
  } = options;

  // Check if ZeptoMail SMTP credentials are configured
  if (!process.env.ZEPTOMAIL_SMTP_USER || !process.env.ZEPTOMAIL_SMTP_PASSWORD) {
    console.warn('[EMAIL] ZeptoMail SMTP credentials not configured. Email not sent.');
    console.log(`[EMAIL] Would send to: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      replyTo,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      // ZeptoMail supports custom headers for tags
      headers: options.tags
        ? options.tags.reduce((acc, tag) => {
            acc[`X-${tag.name}`] = tag.value;
            return acc;
          }, {} as Record<string, string>)
        : undefined,
    };

    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    console.log(`[EMAIL] Sent successfully to ${Array.isArray(to) ? to.join(', ') : to}. ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<{ sent: number; failed: number; results: SendEmailResult[] }> {
  const results: SendEmailResult[] = [];
  let sent = 0;
  let failed = 0;

  // Process emails in batches of 10 to avoid overwhelming the SMTP server
  const batchSize = 10;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(sendEmail));
    
    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Add a small delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed, results };
}

/**
 * Verify SMTP connection
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[EMAIL] ZeptoMail SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL] ZeptoMail SMTP connection verification failed:', error);
    return false;
  }
}
