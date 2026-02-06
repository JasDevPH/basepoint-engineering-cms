// FILE: app/api/admin/products/[id]/variants/[variantId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// PUT update variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params;
    const body = await request.json();
    const { price } = body;

    if (price === undefined || price === null) {
      return NextResponse.json(
        { success: false, error: "Price is required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    // Update variant price
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        price: price ? parseFloat(price) : null,
      },
    });

    return NextResponse.json(
      { success: true, data: variant },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update variant" },
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
