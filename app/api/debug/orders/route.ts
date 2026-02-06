// FILE: app/api/debug/orders/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: true,
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
