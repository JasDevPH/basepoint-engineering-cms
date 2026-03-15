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
    const { price, enabled, previewFileLink } = body;

    // At least one field must be provided
    if (
      price === undefined &&
      enabled === undefined &&
      previewFileLink === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (price !== undefined) {
      updateData.price = price ? parseFloat(price) : null;
    }
    if (enabled !== undefined) {
      updateData.enabled = Boolean(enabled);
    }
    if (previewFileLink !== undefined) {
      updateData.previewFileLink = previewFileLink || null;
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
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

// PATCH alias for PUT
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
) {
  return PUT(request, context);
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    { headers: corsHeaders(request.headers.get("origin") || undefined) }
  );
}
