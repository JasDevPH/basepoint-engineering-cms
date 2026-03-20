import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "email.clicked") {
      console.log("Preview link clicked by recipient:", JSON.stringify(data));
      // Future: update lead record with clickedAt timestamp using data.email
    }

    if (type === "email.delivered") {
      console.log("Email delivered:", JSON.stringify(data));
    }

    if (type === "email.bounced") {
      console.error("Email bounced:", JSON.stringify(data));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
