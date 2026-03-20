// FILE: app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "@/lib/email";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log("🔔 Stripe Webhook received");
    console.log("📝 Signature present:", !!signature);

    let event: Stripe.Event;

    // Verify webhook signature
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        console.log("✅ Stripe signature verified");
      } catch (err: any) {
        console.error("❌ Invalid Stripe webhook signature:", err.message);
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else {
      // Development mode - parse without verification
      console.log("⚠️ Skipping signature verification (development mode)");
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    console.log("📥 Event type:", event.type);

    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log("\n=== STRIPE CHECKOUT COMPLETED ===");
    console.log("📦 Session ID:", session.id);
    console.log("💳 Payment Status:", session.payment_status);
    console.log("💰 Amount:", (session.amount_total || 0) / 100, session.currency?.toUpperCase());
    console.log("📧 Customer Email:", session.customer_details?.email);
    console.log("👤 Customer Name:", session.customer_details?.name);
    console.log("🔗 Payment Link:", session.payment_link);
    console.log("📋 Metadata:", JSON.stringify(session.metadata, null, 2));

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (existingOrder) {
      console.log("⚠️ Order already exists:", existingOrder.orderNumber);

      // Update status if changed
      if (session.payment_status === "paid" && existingOrder.status !== "paid") {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });
        console.log("✅ Order status updated to paid");
      }
      return;
    }

    // Extract customer info
    const customerEmail = session.customer_details?.email || session.customer_email || "unknown@email.com";
    const customerName = session.customer_details?.name || null;
    const totalAmount = (session.amount_total || 0) / 100;
    const currency = session.currency?.toUpperCase() || "USD";
    const isPaid = session.payment_status === "paid";

    // Try to find the product
    let product = null;
    let productName = "Unknown Product";

    // Method 1: Check metadata for product_slug
    if (session.metadata?.product_slug) {
      console.log("🔍 Looking for product with slug:", session.metadata.product_slug);
      product = await prisma.product.findUnique({
        where: { slug: session.metadata.product_slug },
      });
      if (product) {
        console.log("✅ Product found via metadata:", product.title);
        productName = product.title;
      }
    }

    // Method 2: Try to find product by Payment Link URL
    if (!product && session.payment_link) {
      console.log("🔍 Looking for product with Payment Link ID:", session.payment_link);

      // Search for products that have this payment link in their stripePaymentLink field
      const productsWithLink = await prisma.product.findMany({
        where: {
          stripePaymentLink: {
            contains: session.payment_link as string,
          },
        },
      });

      if (productsWithLink.length > 0) {
        product = productsWithLink[0];
        console.log("✅ Product found via Payment Link:", product.title);
        productName = product.title;
      }
    }

    // Method 3: Get product name from line items
    if (session.line_items || session.id) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        if (lineItems.data.length > 0) {
          const firstItem = lineItems.data[0];
          productName = firstItem.description || productName;
          console.log("📦 Product from line items:", productName);

          // Try to find product by title if we haven't found one yet
          if (!product) {
            const productByTitle = await prisma.product.findFirst({
              where: {
                title: {
                  contains: productName,
                  mode: "insensitive",
                },
              },
            });
            if (productByTitle) {
              product = productByTitle;
              console.log("✅ Product found by title match:", product.title);
            }
          }
        }
      } catch (err) {
        console.log("⚠️ Could not fetch line items:", err);
      }
    }

    if (!product) {
      console.log("⚠️ No matching product found in CMS - creating order without product link");
    }

    // Try to find the variant from metadata
    let variant = null;
    let variantName = session.metadata?.variant_name || session.metadata?.model_number || null;

    if (session.metadata?.variant_id) {
      console.log("🔍 Looking for variant with ID:", session.metadata.variant_id);
      variant = await prisma.productVariant.findUnique({
        where: { id: session.metadata.variant_id },
      });
      if (variant) {
        console.log("✅ Variant found:", variant.modelNumber);
        variantName = variant.modelNumber;
      }
    }

    // Build variant description from metadata
    const variantDetails = [];
    if (session.metadata?.capacity) variantDetails.push(session.metadata.capacity);
    if (session.metadata?.length) variantDetails.push(session.metadata.length);
    if (session.metadata?.end_connection) variantDetails.push(session.metadata.end_connection);

    if (variantDetails.length > 0 && !variantName) {
      variantName = variantDetails.join(", ");
    }

    console.log("📦 Variant Name:", variantName);

    // Generate order number
    const orderNumber = `STR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    console.log("💾 Creating order in database...");

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string || null,
        stripeCustomerId: session.customer as string || null,
        customerEmail,
        customerName,
        productId: product?.id || null,
        paymentProvider: "stripe",
        status: "paid",
        totalAmount,
        currency,
        paidAt: new Date(),
        metadata: {
          stripeSession: {
            id: session.id,
            payment_link: typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id || null,
            payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
            customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
          },
          sessionMetadata: session.metadata || {},
        },
      },
    });

    console.log("✅ Order created with ID:", order.id);
    console.log("📋 Order Number:", orderNumber);

    // Create order item with variant info
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variant?.id || null,
        productName: product?.title || productName,
        variantName: variantName,
        price: totalAmount,
        quantity: 1,
      },
    });
    console.log("✅ Order item created with variant:", variantName || "N/A");

    // Send confirmation email to customer and notification to admin
    const finalProductName = product?.title || productName;
    console.log("📧 Sending order emails...");
    await Promise.all([
      sendOrderConfirmationEmail({
        toName: customerName,
        toEmail: customerEmail,
        orderNumber,
        productName: finalProductName,
        variantName: variantName || null,
        totalAmount,
        currency,
      }).catch((err) => console.error("❌ Order confirmation email failed:", err)),

      sendOrderNotificationEmail({
        customerName,
        customerEmail,
        orderNumber,
        productName: finalProductName,
        variantName: variantName || null,
        totalAmount,
        currency,
        paymentProvider: "stripe",
      }).catch((err) => console.error("❌ Order notification email failed:", err)),
    ]);
    console.log("✅ Order emails sent");

    console.log("🎉 Stripe order processing complete!");
    console.log("===\n");
  } catch (error) {
    console.error("❌ Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("💳 Payment Intent succeeded:", paymentIntent.id);

    // Update any pending orders with this payment intent
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (order && order.status !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      });
      console.log("✅ Order updated to paid:", order.orderNumber);
    }
  } catch (error) {
    console.error("❌ Error in handlePaymentIntentSucceeded:", error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    console.log("💸 Processing refund for charge:", charge.id);
    console.log("🔗 Payment Intent:", charge.payment_intent);

    // Find order by payment intent
    if (charge.payment_intent) {
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: charge.payment_intent as string },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "refunded" },
        });
        console.log("✅ Order refunded:", order.orderNumber);
      } else {
        console.log("⚠️ No order found for payment intent");
      }
    }
  } catch (error) {
    console.error("❌ Error in handleChargeRefunded:", error);
  }
}
