// FILE: app/api/admin/blogs/[id]/products/[blogProductId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// PUT update a blog's attached product (enabled / order)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blogProductId: string }> }
) {
  try {
    const { blogProductId } = await params;
    const body = await request.json();
    const { enabled, order } = body;

    if (enabled === undefined && order === undefined) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (enabled !== undefined) {
      updateData.enabled = Boolean(enabled);
    }
    if (order !== undefined) {
      updateData.order = order;
    }

    const blogProduct = await prisma.blogProduct.update({
      where: { id: blogProductId },
      data: updateData,
      include: { product: true },
    });

    return NextResponse.json(
      { success: true, data: blogProduct },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error updating blog product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update blog product" },
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
  context: { params: Promise<{ id: string; blogProductId: string }> }
) {
  return PUT(request, context);
}

// DELETE detach a product from this blog post (product itself is untouched)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blogProductId: string }> }
) {
  try {
    const { blogProductId } = await params;

    await prisma.blogProduct.delete({
      where: { id: blogProductId },
    });

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error detaching blog product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to detach product" },
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
