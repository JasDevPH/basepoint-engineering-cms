// FILE: app/api/checkout/lemon-squeezy/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lemonSqueezy } from "@/lib/lemonsqueezy";
import { corsHeaders } from "@/lib/cors";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();
    const { variantId, productSlug, customData } = body;

    console.log("=== CHECKOUT REQUEST ===");
    console.log("Origin:", origin);
    console.log("Variant ID:", variantId);
    console.log("Product Slug:", productSlug);

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Variant ID is required" },
        {
          status: 400,
          headers: corsHeaders(origin || undefined),
        }
      );
    }

    // Get variant from database
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    console.log("Variant found:", variant?.modelNumber);
    console.log("LS Variant ID:", variant?.lemonSqueezyVariantId);

    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        {
          status: 404,
          headers: corsHeaders(origin || undefined),
        }
      );
    }

    if (!variant.lemonSqueezyVariantId) {
      console.error("❌ Variant not synced to Lemon Squeezy");
      return NextResponse.json(
        {
          success: false,
          error:
            "This product is not configured for checkout. Please contact support.",
        },
        {
          status: 400,
          headers: corsHeaders(origin || undefined),
        }
      );
    }

    // Create checkout URL
    console.log("Creating checkout URL...");

    // Prepare custom data - ONLY include non-null values
    const cleanCustomData: Record<string, string> = {};

    // Add basic variant metadata
    cleanCustomData.productSlug = productSlug || variant.product.slug;
    cleanCustomData.variantId = variant.id;
    cleanCustomData.modelNumber = variant.modelNumber || "N/A";

    // Only add variant fields that have actual values (not null/undefined)
    if (variant.capacity) {
      cleanCustomData.capacity = String(variant.capacity);
    }
    if (variant.length) {
      cleanCustomData.length = String(variant.length);
    }
    if (variant.endConnection) {
      cleanCustomData.endConnection = String(variant.endConnection);
    }

    // Add product info
    cleanCustomData.productTitle = variant.product.title;

    // Add price
    const price = variant.price || variant.product.basePrice;
    if (price) {
      cleanCustomData.price = String(price);
    }

    console.log("Clean custom data:", cleanCustomData);

    const checkoutUrl = await lemonSqueezy.getCheckoutUrl(
      variant.lemonSqueezyVariantId,
      cleanCustomData
    );

    console.log("✓ Checkout URL created:", checkoutUrl);

    return NextResponse.json(
      {
        success: true,
        checkoutUrl,
        product: {
          title: variant.product.title,
          variant: variant.modelNumber,
          price: price,
        },
      },
      { headers: corsHeaders(origin || undefined) }
    );
  } catch (error: any) {
    console.error("❌ Checkout creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout" },
      {
        status: 500,
        headers: corsHeaders(origin || undefined),
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  console.log("OPTIONS request from:", origin);

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(origin || undefined),
  });
}
