// FILE: app/api/admin/lemonsqueezy/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { lemonSqueezy } from "@/lib/lemonsqueezy";
import { corsHeaders } from "@/lib/cors";

// Get all Lemon Squeezy products
export async function GET(request: NextRequest) {
  try {
    const products = await lemonSqueezy.getProducts();

    return NextResponse.json(
      {
        success: true,
        data: products.data,
      },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error: any) {
    console.error("Error fetching LS products:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch products from Lemon Squeezy",
      },
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
