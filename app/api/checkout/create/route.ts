// FILE: app/api/checkout/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lemonSqueezy } from "@/lib/lemonsqueezy";
import { corsHeaders } from "@/lib/cors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, productSlug, customData } = body;

    console.log("Creating checkout for variant:", variantId);

    // Validate required fields
    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Variant ID is required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    // Find variant in database
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    // Check if variant has Lemon Squeezy ID
    if (!variant.lemonSqueezyVariantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not available for purchase. Please contact support.",
        },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    // Create custom data for webhook
    const checkoutCustomData = {
      variant_id: variant.id,
      product_id: variant.product.id,
      product_slug: variant.product.slug,
      variant_model: variant.modelNumber,
      ...customData,
    };

    // Get checkout URL from Lemon Squeezy
    const checkoutUrl = await lemonSqueezy.getCheckoutUrl(
      variant.lemonSqueezyVariantId,
      checkoutCustomData
    );

    console.log("✓ Checkout URL created");

    return NextResponse.json(
      {
        success: true,
        checkoutUrl,
        product: {
          title: variant.product.title,
          variant: variant.modelNumber,
          price: variant.price || variant.product.basePrice,
        },
      },
      {
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
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
