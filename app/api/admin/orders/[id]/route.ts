// FILE: app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("🔍 Fetching order with ID:", id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            description: true,
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
                customFields: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    if (!order) {
      console.log("❌ Order not found");
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    console.log("✅ Order found:", order.orderNumber);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, deliveredAt } = body;

    console.log("📝 Updating order:", id, "New status:", status);

    // Validate status
    const validStatuses = [
      "paid",
      "processing",
      "delivered",
      "refunded",
      "failed",
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Fetch current order to enforce status flow
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Enforce forward-only status transitions
    if (status) {
      const allowedTransitions: Record<string, string[]> = {
        paid: ["processing", "failed", "refunded"],
        processing: ["delivered", "failed", "refunded"],
        delivered: [],
        failed: [],
        refunded: [],
      };

      const allowed = allowedTransitions[currentOrder.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot change status from "${currentOrder.status}" to "${status}". Allowed transitions: ${allowed.length > 0 ? allowed.join(", ") : "none (terminal status)"}`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (deliveredAt) updateData.deliveredAt = new Date(deliveredAt);

    // Auto-set deliveredAt when status changes to delivered
    if (status === "delivered" && !deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Use transaction to update order status and create history record together
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: updateData,
      }),
      ...(status
        ? [
            prisma.orderStatusHistory.create({
              data: {
                orderId: id,
                fromStatus: currentOrder.status,
                toStatus: status,
              },
            }),
          ]
        : []),
    ]);

    // Fetch the updated order with all relations
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        items: {
          include: {
            variant: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    console.log(`✅ Order ${order!.orderNumber} updated to: ${status}`);

    return NextResponse.json({
      success: true,
      data: order!,
    });
  } catch (error: any) {
    console.error("❌ Error updating order:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE order (admin only - for cleanup/testing)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("🗑️ Deleting order:", id);

    await prisma.order.delete({
      where: { id },
    });

    console.log("✅ Order deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting order:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
