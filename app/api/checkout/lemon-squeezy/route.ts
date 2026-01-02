import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, price, variantId, quantity = 1, customData } = body;

    // Validate required fields
    if (!productName || !price) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      console.error("Lemon Squeezy credentials not configured");
      return NextResponse.json(
        { success: false, error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Create checkout session with Lemon Squeezy API
    const checkoutData = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: customData || {
              product_name: productName,
              variant_id: variantId || "n/a",
            },
            embed: true, // Enable embed mode
          },
          product_options: {
            name: productName,
            description: `Purchase of ${productName}`,
            // No redirect URL needed for embedded checkout
          },
          checkout_options: {
            embed: true,
            media: false,
            logo: true,
            desc: true,
            discount: true,
            button_color: "#10b981",
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId || process.env.LEMON_SQUEEZY_VARIANT_ID,
            },
          },
        },
      },
    };

    console.log("Creating Lemon Squeezy checkout...");

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(checkoutData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lemon Squeezy API error:", data);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create checkout session",
          details: data,
        },
        { status: response.status }
      );
    }

    // Return checkout URL for embedding
    const checkoutUrl = data.data.attributes.url;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      data: data.data,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
