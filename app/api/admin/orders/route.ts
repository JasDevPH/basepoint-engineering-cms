// FILE: app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    console.log("📊 Fetching orders - Status:", status, "Page:", page);

    // Build filter
    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    // Get total count
    const total = await prisma.order.count({ where });
    console.log("📈 Total orders found:", total);

    // Get orders with relations
    const orders = await prisma.order.findMany({
      where,
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    console.log("✅ Retrieved", orders.length, "orders");

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
