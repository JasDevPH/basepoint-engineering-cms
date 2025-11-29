// FILE: app/api/products/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        categoryOrder: true,
      },
      orderBy: [
        { category: "asc" },
        { categoryOrder: "asc" },
        { title: "asc" },
      ],
    });

    // Group products by category
    const grouped = products.reduce((acc: any, product) => {
      const category = product.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: product.id,
        slug: product.slug,
        title: product.title,
      });
      return acc;
    }, {});

    return NextResponse.json(
      { success: true, data: grouped },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
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
