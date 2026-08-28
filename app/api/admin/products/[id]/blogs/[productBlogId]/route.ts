// FILE: app/api/admin/products/[id]/blogs/[productBlogId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// PUT update a product's attached blog post (enabled / order)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productBlogId: string }> }
) {
  try {
    const { productBlogId } = await params;
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

    const productBlog = await prisma.blogProduct.update({
      where: { id: productBlogId },
      data: updateData,
      include: { blog: true },
    });

    return NextResponse.json(
      { success: true, data: productBlog },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error updating product blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product blog" },
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
  context: { params: Promise<{ id: string; productBlogId: string }> }
) {
  return PUT(request, context);
}

// DELETE detach a blog post from this product (blog itself is untouched)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productBlogId: string }> }
) {
  try {
    const { productBlogId } = await params;

    await prisma.blogProduct.delete({
      where: { id: productBlogId },
    });

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error detaching product blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to detach blog" },
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
