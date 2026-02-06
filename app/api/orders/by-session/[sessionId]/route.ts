// FILE: app/api/orders/by-session/[sessionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    console.log("🔍 Looking for order with session ID:", sessionId);

    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
          },
        },
        items: {
          include: {
            variant: {
              select: {
                id: true,
                modelNumber: true,
                capacity: true,
                length: true,
                endConnection: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      console.log("⚠️ Order not found for session:", sessionId);
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404, headers: corsHeaders(request.headers.get("origin") || undefined) }
      );
    }

    console.log("✅ Order found:", order.orderNumber);

    return NextResponse.json(
      { success: true, data: order },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500, headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    { headers: corsHeaders(request.headers.get("origin") || undefined) }
  );
}
