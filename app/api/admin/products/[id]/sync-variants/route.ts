// FILE: app/api/admin/products/[id]/sync-variants/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lemonSqueezy, toDollars } from "@/lib/lemonsqueezy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("=== SYNCING VARIANTS ===");
    console.log("Product ID:", id);

    // Get product with variants
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.lemonSqueezyProductId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product not linked to Lemon Squeezy. Please select a LS product first.",
        },
        { status: 400 }
      );
    }

    console.log("Product:", product.title);
    console.log("LS Product ID:", product.lemonSqueezyProductId);
    console.log("CMS Variants:", product.variants.length);
    console.log("Price Type:", product.priceType);
    console.log("Base Price:", product.basePrice);

    // ✅ Fetch LS variants (now with pagination support in service)
    const lsVariantsResponse = await lemonSqueezy.getVariants(
      product.lemonSqueezyProductId
    );
    const lsVariants = lsVariantsResponse.data || [];

    console.log("LS Variants found:", lsVariants.length);

    if (lsVariants.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No variants found in Lemon Squeezy",
        instructions: [
          "1. Go to Lemon Squeezy dashboard",
          "2. Navigate to your product",
          "3. Create variants with names matching your CMS variant model numbers",
          "4. Come back and sync again",
        ],
        productUrl: `https://app.lemonsqueezy.com/products/${product.lemonSqueezyProductId}`,
      });
    }

    // Match and sync variants
    const results = {
      matched: [] as any[],
      unmatched: [] as any[],
      priceUpdated: [] as any[],
      alreadyLinked: [] as any[],
    };

    for (const cmsVariant of product.variants) {
      const modelNumber = cmsVariant.modelNumber || null;

      // Skip variants without model numbers
      if (!modelNumber) {
        console.log(`\n--- Skipping variant without model number ---`);
        results.unmatched.push({
          modelNumber: "N/A",
          cmsVariantId: cmsVariant.id,
          suggestedName: "Variant has no model number",
        });
        continue;
      }

      console.log(`\n--- Processing: ${modelNumber} ---`);

      // Check if already linked
      if (cmsVariant.lemonSqueezyVariantId) {
        console.log(
          "Already linked to LS variant:",
          cmsVariant.lemonSqueezyVariantId
        );

        // Find the LS variant to check price
        const lsVariant = lsVariants.find(
          (v: any) => v.id === cmsVariant.lemonSqueezyVariantId
        );

        if (lsVariant) {
          const lsPrice = toDollars(lsVariant.attributes.price);
          const cmsPrice = cmsVariant.price || product.basePrice || 0;

          console.log("LS Price:", lsPrice);
          console.log("CMS Price:", cmsPrice);

          if (Math.abs(lsPrice - cmsPrice) > 0.01) {
            // Price mismatch - update CMS to match LS
            await prisma.productVariant.update({
              where: { id: cmsVariant.id },
              data: {
                price: lsPrice,
                lemonSqueezyPrice: lsVariant.attributes.price,
                syncedAt: new Date(),
              },
            });

            results.priceUpdated.push({
              modelNumber,
              oldPrice: cmsPrice,
              newPrice: lsPrice,
              lsVariantId: lsVariant.id,
            });

            console.log(`✓ Price updated: $${cmsPrice} → $${lsPrice}`);
          } else {
            results.alreadyLinked.push({
              modelNumber,
              lsVariantId: cmsVariant.lemonSqueezyVariantId,
              price: lsPrice,
            });
            console.log("✓ Already synced, prices match");
          }
        }

        continue;
      }

      // Try to find matching LS variant by name
      const lsVariant = lsVariants.find((lsv: any) => {
        const lsName = lsv.attributes.name.toLowerCase().trim();
        const cmsName = modelNumber.toLowerCase().trim();

        // Exact match
        if (lsName === cmsName) return true;

        // Contains match
        if (lsName.includes(cmsName) || cmsName.includes(lsName)) return true;

        return false;
      });

      if (lsVariant) {
        const lsPrice = toDollars(lsVariant.attributes.price);

        console.log("✓ Match found!");
        console.log("  LS Variant:", lsVariant.attributes.name);
        console.log("  LS Variant ID:", lsVariant.id);
        console.log("  LS Price:", lsPrice);

        // Link the variant and sync price
        await prisma.productVariant.update({
          where: { id: cmsVariant.id },
          data: {
            lemonSqueezyVariantId: lsVariant.id,
            price: lsPrice, // Use LS price as source of truth
            lemonSqueezyPrice: lsVariant.attributes.price,
            syncedAt: new Date(),
          },
        });

        results.matched.push({
          cmsVariant: modelNumber,
          lsVariant: lsVariant.attributes.name,
          lsVariantId: lsVariant.id,
          price: lsPrice,
        });

        console.log(`✓ Linked and synced: ${modelNumber} → ${lsVariant.id}`);
      } else {
        console.log("✗ No match found in LS");

        results.unmatched.push({
          modelNumber,
          cmsVariantId: cmsVariant.id,
          suggestedName: modelNumber,
        });
      }
    }

    // Update product sync timestamp
    await prisma.product.update({
      where: { id },
      data: { syncedAt: new Date() },
    });

    console.log("\n=== SYNC COMPLETE ===");
    console.log("Matched:", results.matched.length);
    console.log("Price Updated:", results.priceUpdated.length);
    console.log("Already Linked:", results.alreadyLinked.length);
    console.log("Unmatched:", results.unmatched.length);

    return NextResponse.json({
      success: true,
      summary: {
        total: product.variants.length,
        matched: results.matched.length,
        priceUpdated: results.priceUpdated.length,
        alreadyLinked: results.alreadyLinked.length,
        unmatched: results.unmatched.length,
      },
      results,
      availableLSVariants: lsVariants.map((v: any) => ({
        id: v.id,
        name: v.attributes.name,
        price: toDollars(v.attributes.price),
        status: v.attributes.status,
      })),
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
