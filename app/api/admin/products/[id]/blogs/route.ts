// FILE: app/api/admin/products/[id]/blogs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// GET all blog posts attached to a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productBlogs = await prisma.blogProduct.findMany({
      where: { productId: id },
      include: { blog: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(
      { success: true, data: productBlogs },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching product blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product blogs" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// POST attach a blog post to this product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { blogId } = body;

    if (!blogId) {
      return NextResponse.json(
        { success: false, error: "blogId is required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const productBlog = await prisma.blogProduct.create({
      data: {
        blogId,
        productId: id,
        enabled: true,
        order: 0,
      },
      include: { blog: true },
    });

    return NextResponse.json(
      { success: true, data: productBlog },
      {
        status: 201,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error attaching blog to product:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "This blog post is already attached to this product",
        },
        {
          status: 409,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to attach blog to product" },
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
