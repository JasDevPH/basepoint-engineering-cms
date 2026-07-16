// FILE: app/api/admin/products/[id]/faqs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// GET all FAQs attached to a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productFaqs = await prisma.productFaq.findMany({
      where: { productId: id },
      include: { faq: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(
      { success: true, data: productFaqs },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching product FAQs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product FAQs" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// POST attach a library FAQ to this product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { faqId } = body;

    if (!faqId) {
      return NextResponse.json(
        { success: false, error: "faqId is required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const productFaq = await prisma.productFaq.create({
      data: {
        productId: id,
        faqId,
        enabled: true,
        order: 0,
      },
      include: { faq: true },
    });

    return NextResponse.json(
      { success: true, data: productFaq },
      {
        status: 201,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error attaching FAQ to product:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "This FAQ is already attached to this product",
        },
        {
          status: 409,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to attach FAQ to product" },
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
