// FILE: app/api/webhooks/lemonsqueezy/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "@/lib/email";

// Verify webhook signature
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    console.log("🔔 Webhook received");
    console.log("📝 Signature present:", !!signature);

    // Skip signature verification in development/testing
    // REMOVE THIS IN PRODUCTION!
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error("❌ Invalid webhook signature");
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 401 }
        );
      }
      console.log("✅ Signature verified");
    } else {
      console.log("⚠️ Skipping signature verification (development mode)");
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;

    console.log("📥 Event:", eventName);

    // Handle different webhook events
    switch (eventName) {
      case "order_created":
        await handleOrderCreated(payload);
        break;

      case "order_refunded":
        await handleOrderRefunded(payload);
        break;

      default:
        console.log("ℹ️ Unhandled event:", eventName);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleOrderCreated(payload: any) {
  try {
    const orderData = payload.data;
    const attributes = orderData.attributes;
    const customData = payload.meta?.custom_data || {};

    console.log("\n=== ORDER CREATED ===");
    console.log("📦 Order Number:", attributes.order_number);
    console.log("💳 Status:", attributes.status);
    console.log("💰 Total:", attributes.total / 100, attributes.currency);
    console.log("🎯 Custom Data:", JSON.stringify(customData, null, 2));

    // Extract order details
    const lemonSqueezyOrderId = orderData.id.toString();
    const orderNumber = attributes.order_number.toString();
    const customerEmail = attributes.user_email;
    const customerName = attributes.user_name || null;
    const totalAmount = attributes.total / 100;
    const currency = attributes.currency || "USD";
    const orderStatus = attributes.status;
    const isPaid = orderStatus === "paid";

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { lemonSqueezyOrderId },
    });

    if (existingOrder) {
      console.log("⚠️ Order already exists:", existingOrder.orderNumber);

      if (existingOrder.status !== orderStatus) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: isPaid ? "paid" : orderStatus,
          },
        });
        console.log(
          `✅ Status updated: ${existingOrder.status} → ${orderStatus}`
        );
      }

      return;
    }

    // Find product using the slug from custom data
    let product = null;
    if (customData.productSlug) {
      console.log("🔍 Looking for product with slug:", customData.productSlug);
      product = await prisma.product.findUnique({
        where: { slug: customData.productSlug },
      });

      if (product) {
        console.log("✅ Product found:", product.title);
      } else {
        console.error(
          "❌ Product not found with slug:",
          customData.productSlug
        );
        throw new Error(`Product not found: ${customData.productSlug}`);
      }
    } else {
      console.error("❌ No productSlug in custom data");
      throw new Error("Missing productSlug in custom data");
    }

    // Find variant using the ID from custom data
    let variant = null;
    if (customData.variantId) {
      console.log("🔍 Looking for variant with ID:", customData.variantId);
      variant = await prisma.productVariant.findUnique({
        where: { id: customData.variantId },
      });

      if (variant) {
        console.log("✅ Variant found:", variant.modelNumber);
      } else {
        console.log("⚠️ Variant not found with ID:", customData.variantId);
      }
    }

    // Create the order
    console.log("💾 Creating order in database...");

    const order = await prisma.order.create({
      data: {
        orderNumber,
        lemonSqueezyOrderId,
        lemonSqueezyCustomerId: attributes.customer_id?.toString() || null,
        customerEmail,
        customerName,
        productId: product.id,
        status: "paid",
        totalAmount,
        currency,
        paidAt: new Date(),
        metadata: {
          customData,
          lemonSqueezyData: attributes,
        },
      },
    });

    console.log("✅ Order created with ID:", order.id);

    // Create order item with required fields
    const orderItemData = {
      orderId: order.id,
      variantId: variant?.id || null,
      productName: customData.productTitle || product.title,
      variantName: customData.modelNumber || variant?.modelNumber || null,
      quantity: 1,
      price: totalAmount,
    };

    console.log("💾 Creating order item:", orderItemData);

    await prisma.orderItem.create({
      data: orderItemData,
    });

    console.log("✅ Order item created");

    // Send confirmation email to customer and notification to admin
    const finalProductName = customData.productTitle || product.title;
    const finalVariantName = customData.modelNumber || variant?.modelNumber || null;
    sendOrderConfirmationEmail({
      toName: customerName,
      toEmail: customerEmail,
      orderNumber,
      productName: finalProductName,
      variantName: finalVariantName,
      totalAmount,
      currency,
    }).catch((err) => console.error("Order confirmation email failed:", err));

    sendOrderNotificationEmail({
      customerName,
      customerEmail,
      orderNumber,
      productName: finalProductName,
      variantName: finalVariantName,
      totalAmount,
      currency,
      paymentProvider: "lemonsqueezy",
    }).catch((err) => console.error("Order notification email failed:", err));

    console.log("🎉 Order processing complete!");
    console.log("===\n");
  } catch (error) {
    console.error("❌ Error in handleOrderCreated:", error);
    throw error;
  }
}

async function handleOrderRefunded(payload: any) {
  try {
    const orderData = payload.data;
    const lemonSqueezyOrderId = orderData.id.toString();

    console.log("💸 Processing refund for order:", lemonSqueezyOrderId);

    const order = await prisma.order.findUnique({
      where: { lemonSqueezyOrderId },
    });

    if (!order) {
      console.error("❌ Order not found for refund");
      return;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "refunded" },
    });

    console.log("✅ Order refunded:", order.orderNumber);
  } catch (error) {
    console.error("❌ Error in handleOrderRefunded:", error);
    throw error;
  }
}
