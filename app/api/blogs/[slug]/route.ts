// FILE: app/api/blogs/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        products: {
          where: { enabled: true },
          orderBy: { order: "asc" },
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                title: true,
                imageUrl: true,
                category: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const products = blog.products.map((bp) => ({
      id: bp.product.id,
      slug: bp.product.slug,
      title: bp.product.title,
      imageUrl: bp.product.imageUrl,
      category: bp.product.category,
      basePrice: bp.product.basePrice,
      order: bp.order,
    }));

    return NextResponse.json(
      { success: true, data: { ...blog, products } },
      {
        status: 200,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog" },
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
