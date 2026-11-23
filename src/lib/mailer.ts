import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Mythium Store" <${process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Email send error:", message);
    throw new Error(
      `Failed to send email: ${message}. ` +
      `Please check your SMTP configuration in .env.local. ` +
      `If using Gmail, ensure you have enabled App Passwords.`
    );
  }
}

// ---- Email Templates ----

export function orderConfirmationEmail(
  customerName: string,
  invoice: string,
  items: { name: string; size: string; color: string; qty: number; price: number }[],
  total: number,
  trackingCode?: string
): string {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.size} / ${item.color}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">৳${item.price}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Mythium</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Order Confirmed ✓</p>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin: 0 0 8px;">Hello, ${customerName}!</h2>
        <p style="color: #6b7280;">Thank you for your order. Here are your order details:</p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Invoice:</strong> ${invoice}</p>
          ${trackingCode ? `<p style="margin: 4px 0;"><strong>Tracking Code:</strong> ${trackingCode}</p>` : ""}
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: left;">Variant</th>
              <th style="padding: 12px; text-align: left;">Qty</th>
              <th style="padding: 12px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px; font-weight: bold; text-align: right;">Total:</td>
              <td style="padding: 12px; font-weight: bold;">৳${total}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
          You can track your order status from your dashboard.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Mythium. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function newsletterEmail(subject: string, content: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Mythium</h1>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937;">${subject}</h2>
        <div style="color: #374151; line-height: 1.6;">${content}</div>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          You received this email because you subscribed to Mythium newsletter.
        </p>
      </div>
    </div>
  `;
}

export function newProductEmail(
  productName: string,
  productImage: string,
  productPrice: number,
  productLink: string
): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Mythium</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">🆕 New Arrival!</p>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
        <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px;" />
        <h2 style="color: #1f2937; margin: 0 0 8px;">${productName}</h2>
        <p style="color: #6366f1; font-size: 24px; font-weight: bold; margin: 8px 0;">৳${productPrice}</p>
        <a href="${productLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          Shop Now →
        </a>
      </div>
      <div style="background: #f9fafb; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Mythium. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function supportAutoReplyEmail(customerName: string, inquiryPreview: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="background: #000; padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 4px; text-transform: uppercase;">MYTHIUM</h1>
      </div>
      <div style="background: white; padding: 40px; border: 1px solid #000; border-top: none;">
        <h2 style="color: #000; margin: 0 0 16px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">Message Received</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello ${customerName},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Thank you for reaching out to us. This is an automated response to confirm that we have received your message. Our support team is reviewing it and will get back to you shortly.</p>
        <div style="background: #fafafa; border-left: 4px solid #000; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #666; font-style: italic; font-size: 14px;">"${inquiryPreview}"</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">We appreciate your patience.</p>
        <p style="color: #000; font-size: 14px; font-weight: bold; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">- The Mythium Team</p>
      </div>
      <div style="background: #000; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #888; font-size: 12px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">© ${new Date().getFullYear()} Mythium. All rights reserved.</p>
      </div>
    </div>
  `;
}
