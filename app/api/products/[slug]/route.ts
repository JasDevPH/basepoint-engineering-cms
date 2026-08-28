// FILE: app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          orderBy: [{ capacity: "asc" }, { length: "asc" }],
        },
        faqs: {
          where: { enabled: true },
          orderBy: { order: "asc" },
          include: { faq: true },
        },
        blogs: {
          where: { enabled: true },
          orderBy: { order: "asc" },
          include: {
            blog: {
              select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const faqs = product.faqs.map((pf) => ({
      id: pf.faq.id,
      question: pf.faq.question,
      answer: pf.faq.answer,
      order: pf.order,
    }));

    const blogs = product.blogs.map((bp) => ({
      id: bp.blog.id,
      slug: bp.blog.slug,
      title: bp.blog.title,
      excerpt: bp.blog.excerpt,
      imageUrl: bp.blog.imageUrl,
      order: bp.order,
    }));

    return NextResponse.json(
      { success: true, data: { ...product, faqs, blogs } },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
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
