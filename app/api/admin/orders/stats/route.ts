// FILE: app/api/admin/orders/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Fetching order statistics...");

    // Get counts by status
    const [
      totalOrders,
      paidOrders,
      processingOrders,
      deliveredOrders,
      refundedOrders,
      failedOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "paid" } }),
      prisma.order.count({ where: { status: "processing" } }),
      prisma.order.count({ where: { status: "delivered" } }),
      prisma.order.count({ where: { status: "refunded" } }),
      prisma.order.count({ where: { status: "failed" } }),
    ]);

    console.log("📈 Total orders:", totalOrders);

    // Get total revenue (only paid and delivered orders)
    const revenueResult = await prisma.order.aggregate({
      where: {
        status: {
          in: ["paid", "processing", "delivered"],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = revenueResult._sum.totalAmount || 0;
    console.log("💰 Total revenue:", totalRevenue);

    // Get recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        statusCounts: {
          paid: paidOrders,
          processing: processingOrders,
          delivered: deliveredOrders,
          refunded: refundedOrders,
          failed: failedOrders,
        },
        totalRevenue,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching order stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order statistics" },
      { status: 500 }
    );
  }
}
