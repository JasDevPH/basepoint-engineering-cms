// FILE: app/api/admin/blogs/[id]/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// GET all products attached to a blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blogProducts = await prisma.blogProduct.findMany({
      where: { blogId: id },
      include: { product: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(
      { success: true, data: blogProducts },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching blog products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog products" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// POST attach a product to this blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "productId is required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const blogProduct = await prisma.blogProduct.create({
      data: {
        blogId: id,
        productId,
        enabled: true,
        order: 0,
      },
      include: { product: true },
    });

    return NextResponse.json(
      { success: true, data: blogProduct },
      {
        status: 201,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error attaching product to blog:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "This product is already attached to this blog post",
        },
        {
          status: 409,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to attach product to blog" },
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
