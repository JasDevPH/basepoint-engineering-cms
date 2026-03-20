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

export async function sendPreviewFileEmail(params: SendPreviewFileEmailParams): Promise<void> {
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

  await resend.emails.send({
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
