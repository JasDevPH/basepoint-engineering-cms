import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "email.clicked") {
      const emailId = data?.email_id as string | undefined;
      if (emailId) {
        await prisma.lead.updateMany({
          where: { emailId, emailClickedAt: null },
          data: { emailClickedAt: new Date() },
        });
      }
      console.log("Preview link clicked:", emailId);
    }

    if (type === "email.delivered") {
      console.log("Email delivered:", data?.email_id);
    }

    if (type === "email.bounced") {
      console.error("Email bounced:", data?.email_id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
