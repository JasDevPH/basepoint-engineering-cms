import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPreviewFileEmailParams {
  toName: string;
  toEmail: string;
  productTitle: string;
  variantModel: string;
  previewFileLink: string;
  checkoutLink?: string;
}

interface SendLeadNotificationEmailParams {
  name: string;
  email: string;
  productTitle: string | null;
  variantModel: string | null;
  previewFileLink: string | null;
  claimedAt: Date;
}

export async function sendPreviewFileEmail(params: SendPreviewFileEmailParams): Promise<string> {
  const { toName, toEmail, productTitle, variantModel, previewFileLink, checkoutLink } = params;

  const checkoutSection = checkoutLink
    ? `
        <div style="margin-top: 16px;">
          <a href="${checkoutLink}"
             style="background-color: #1e3a8a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Purchase — ${variantModel}
          </a>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 8px;">Or copy this checkout link: <span style="word-break: break-all;">${checkoutLink}</span></p>
      `
    : "";

  const result = await resend.emails.send({
    from: "Basepoint Engineering <mail@notify.basepointengineering.com>",
    to: toEmail,
    subject: `Your Preview File — ${productTitle} (${variantModel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 8px;">Hi ${toName},</h2>
        <p style="color: #444;">Here is your preview file for <strong>${productTitle}</strong> — <strong>${variantModel}</strong>.</p>
        <div style="margin: 32px 0;">
          <a href="${previewFileLink}"
             style="background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Open Preview File
          </a>
          ${checkoutSection}
        </div>
        <p style="color: #888; font-size: 13px;">If the preview button doesn't work, copy and paste this link: <span style="word-break: break-all;">${previewFileLink}</span></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">Basepoint Engineering · basepoint.engineering</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data?.id ?? "";
}

interface SendOrderConfirmationEmailParams {
  toName: string | null;
  toEmail: string;
  orderNumber: string;
  productName: string;
  variantName: string | null;
  totalAmount: number;
  currency: string;
}

interface SendOrderNotificationEmailParams {
  customerName: string | null;
  customerEmail: string;
  orderNumber: string;
  productName: string;
  variantName: string | null;
  totalAmount: number;
  currency: string;
  paymentProvider: string;
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationEmailParams): Promise<void> {
  const { toName, toEmail, orderNumber, productName, variantName, totalAmount, currency } = params;

  const displayName = toName || "there";
  const variantRow = variantName
    ? `<tr><td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;width:160px;">Variant</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${variantName}</td></tr>`
    : "";

  const confirmResult = await resend.emails.send({
    from: "Basepoint Engineering <mail@notify.basepointengineering.com>",
    to: toEmail,
    subject: `Order Confirmed — ${productName} (#${orderNumber})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">

        <div style="background:#1e3a8a;border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:28px;">
          <p style="color:#93c5fd;font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Order Confirmed</p>
          <h1 style="color:#ffffff;font-size:1.6rem;font-weight:700;margin:0 0 6px;">Thank you, ${displayName}!</h1>
          <p style="color:#bfdbfe;font-size:0.9rem;margin:0;">Your payment was received and your order is confirmed.</p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr style="background:#f9f9f9;">
            <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;width:160px;">Order Number</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;">#${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;">Product</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${productName}</td>
          </tr>
          ${variantRow}
          <tr style="background:#f9f9f9;">
            <td style="padding:8px 12px;color:#555;font-weight:bold;">Total Paid</td>
            <td style="padding:8px 12px;font-weight:700;color:#1e3a8a;">$${totalAmount.toFixed(2)} ${currency}</td>
          </tr>
        </table>

        <p style="color:#4b5563;font-size:0.875rem;line-height:1.65;">
          We will process and deliver your order as soon as possible. Thank you!
        </p>

        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="color:#aaa;font-size:12px;">Basepoint Engineering · basepoint.engineering</p>
      </div>
    `,
  });

  if (confirmResult.error) {
    throw new Error(confirmResult.error.message);
  }
}

export async function sendOrderNotificationEmail(params: SendOrderNotificationEmailParams): Promise<void> {
  const { customerName, customerEmail, orderNumber, productName, variantName, totalAmount, currency, paymentProvider } = params;

  const variantRow = variantName
    ? `<tr><td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;width:160px;">Variant</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${variantName}</td></tr>`
    : "";

  const providerBadge = paymentProvider === "stripe"
    ? `<span style="background:#635bff;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">Stripe</span>`
    : `<span style="background:#f59e0b;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">Lemon Squeezy</span>`;

  const notifyResult = await resend.emails.send({
    from: "Basepoint System <system@notify.basepointengineering.com>",
    to: "jay@basepointengineering.com",
    subject: `💰 New Order: ${customerName || customerEmail} — ${productName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="margin-bottom:4px;">New Order Received</h2>
        <p style="color:#666;margin-top:0;">A customer just completed a purchase. ${providerBadge}</p>

        <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:14px;">
          <tr style="background:#f9f9f9;">
            <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;width:160px;">Order Number</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;">#${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;">Customer Name</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${customerName || "—"}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;">Customer Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:${customerEmail}">${customerEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#555;border-bottom:1px solid #eee;font-weight:bold;">Product</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${productName}</td>
          </tr>
          ${variantRow}
          <tr style="background:#f9f9f9;">
            <td style="padding:8px 12px;color:#555;font-weight:bold;">Total</td>
            <td style="padding:8px 12px;font-weight:700;color:#1e3a8a;">$${totalAmount.toFixed(2)} ${currency}</td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="color:#aaa;font-size:12px;">Basepoint Engineering System Notification</p>
      </div>
    `,
  });

  if (notifyResult.error) {
    throw new Error(notifyResult.error.message);
  }
}

export async function sendLeadNotificationEmail(params: SendLeadNotificationEmailParams): Promise<void> {
  const { name, email, productTitle, variantModel, previewFileLink, claimedAt } = params;

  const formattedDate = claimedAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });

  const previewLinkRow = previewFileLink
    ? `<tr><td style="padding: 8px 12px; color: #555; border-bottom: 1px solid #eee;">Preview Link</td><td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="${previewFileLink}">${previewFileLink}</a></td></tr>`
    : "";

  await resend.emails.send({
    from: "Basepoint System <system@notify.basepointengineering.com>",
    to: "jay@basepointengineering.com",
    subject: `New Lead: ${name} requested ${productTitle ?? "a product"}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="margin-bottom: 4px;">New Lead</h2>
        <p style="color: #666; margin-top: 0;">A new preview file was requested.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px;">
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 12px; color: #555; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #555; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${email}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 12px; color: #555; border-bottom: 1px solid #eee; font-weight: bold;">Product</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${productTitle ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #555; border-bottom: 1px solid #eee; font-weight: bold;">Variant</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${variantModel ?? "—"}</td>
          </tr>
          ${previewLinkRow}
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px 12px; color: #555; font-weight: bold;">Timestamp</td>
            <td style="padding: 8px 12px;">${formattedDate}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">Basepoint Engineering System Notification</p>
      </div>
    `,
  });
}
