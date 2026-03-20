import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { sendPreviewFileEmail, sendLeadNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, productSlug, productTitle, variantId, variantModel, previewFileLink, checkoutLink } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        productSlug: productSlug || null,
        productTitle: productTitle || null,
        variantId: variantId || null,
        variantModel: variantModel || null,
        previewFileLink: previewFileLink || null,
      },
    });

    // Send preview email to customer and capture result
    if (lead.previewFileLink) {
      try {
        const emailId = await sendPreviewFileEmail({
          toName: name,
          toEmail: email,
          productTitle: productTitle || "Product",
          variantModel: variantModel || "Variant",
          previewFileLink: lead.previewFileLink,
          checkoutLink: checkoutLink || undefined,
        });
        await prisma.lead.update({
          where: { id: lead.id },
          data: { emailSentAt: new Date(), emailId: emailId || null },
        });
      } catch (err) {
        console.error("Preview email failed:", err);
      }
    }

    // Send admin notification (fire and forget)
    sendLeadNotificationEmail({
      name,
      email,
      productTitle: productTitle || null,
      variantModel: variantModel || null,
      previewFileLink: lead.previewFileLink,
      claimedAt: lead.claimedAt,
    }).catch((err) => console.error("Lead notification email failed:", err));

    return NextResponse.json(
      { success: true, previewFileLink: lead.previewFileLink },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record lead" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    { headers: corsHeaders(request.headers.get("origin") || undefined) }
  );
}
