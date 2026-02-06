// FILE: app/api/checkout/stripe/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, productSlug, customData } = body;

    console.log("🛒 Stripe Checkout Request:");
    console.log("  - Variant ID:", variantId);
    console.log("  - Product Slug:", productSlug);
    console.log("  - Custom Data:", customData);

    // Find the product
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404, headers: corsHeaders(request.headers.get("origin") || undefined) }
      );
    }

    // Find the variant if provided
    let variant = null;
    let price = product.basePrice || 0;
    let productName = product.title;
    let variantName = null;

    if (variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (variant) {
        price = variant.price || product.basePrice || 0;
        variantName = variant.modelNumber || null;
        productName = `${product.title} - ${variant.modelNumber || ""}`;

        // Add variant details to name
        const details = [];
        if (variant.capacity) details.push(variant.capacity);
        if (variant.length) details.push(variant.length);
        if (variant.endConnection) details.push(variant.endConnection);
        if (details.length > 0) {
          productName = `${product.title} (${details.join(", ")})`;
        }
      }
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Product price not set" },
        { status: 400, headers: corsHeaders(request.headers.get("origin") || undefined) }
      );
    }

    console.log("  - Product Name:", productName);
    console.log("  - Variant Name:", variantName);
    console.log("  - Price:", price);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: variantName || product.description || undefined,
              images: product.imageUrl ? [product.imageUrl] : undefined,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin")}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/product-detail?slug=${productSlug}`,
      metadata: {
        product_slug: productSlug,
        product_id: product.id,
        product_title: product.title,
        variant_id: variantId || "",
        variant_name: variantName || "",
        model_number: customData?.model_number || "",
        capacity: customData?.capacity || "",
        length: customData?.length || "",
        end_connection: customData?.end_connection || "",
      },
    });

    console.log("✅ Stripe Checkout Session created:", session.id);
    console.log("  - Checkout URL:", session.url);

    return NextResponse.json(
      {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error: any) {
    console.error("❌ Stripe Checkout Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session" },
      { status: 500, headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    { headers: corsHeaders(request.headers.get("origin") || undefined) }
  );
}
