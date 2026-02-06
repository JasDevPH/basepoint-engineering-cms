// FILE: app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// Helper function to generate variants with custom fields support and optional capacity
function generateVariants(
  productId: string,
  capacities: string | null,
  capacityUnit: string,
  lengths: string | null,
  lengthUnit: string,
  connectionStyles: string | null,
  customFields: any[] | null,
  productTitle: string,
  priceType: string,
  basePrice: number | null
) {
  const capacityList = capacities
    ? capacities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
  const lengthList = lengths
    ? lengths
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  const connectionList = connectionStyles
    ? connectionStyles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const customFieldsList =
    customFields && Array.isArray(customFields)
      ? customFields
          .filter((cf) => cf.name?.trim() && cf.values?.trim())
          .map((cf) => ({
            name: cf.name.trim(),
            values: cf.values
              .split(",")
              .map((v: string) => v.trim())
              .filter(Boolean),
          }))
      : [];

  const variants: any[] = [];

  const generateCombinations = (
    capacity: string | null,
    length: string | null,
    connection: string | null,
    customFieldsData: Array<{ name: string; value: string }>
  ) => {
    const customFieldsObj: Record<string, string> = {};
    customFieldsData.forEach((cf) => {
      customFieldsObj[cf.name] = cf.value;
    });

    let modelParts = [productTitle.substring(0, 3).toUpperCase()];

    if (capacity) modelParts.push(`${capacity}${capacityUnit}`);
    if (length) modelParts.push(`${length}${lengthUnit}`);
    if (connection) modelParts.push(connection);
    customFieldsData.forEach((cf) => {
      modelParts.push(cf.value);
    });

    variants.push({
      productId,
      capacity: capacity ? `${capacity} ${capacityUnit}` : null,
      length: length ? `${length} ${lengthUnit}` : null,
      endConnection: connection || null,
      modelNumber: modelParts.join("-"),
      price: priceType === "base" ? basePrice : null,
      customFields:
        Object.keys(customFieldsObj).length > 0 ? customFieldsObj : null,
    });
  };

  const processCustomFields = (
    capacity: string | null,
    length: string | null,
    connection: string | null,
    fieldIndex: number,
    currentCustomFields: Array<{ name: string; value: string }>
  ) => {
    if (fieldIndex >= customFieldsList.length) {
      generateCombinations(capacity, length, connection, currentCustomFields);
      return;
    }

    const field = customFieldsList[fieldIndex];
    field.values.forEach((value: string) => {
      processCustomFields(capacity, length, connection, fieldIndex + 1, [
        ...currentCustomFields,
        { name: field.name, value },
      ]);
    });
  };

  if (capacityList.length === 0) {
    if (lengthList.length === 0 && connectionList.length === 0) {
      if (customFieldsList.length > 0) {
        processCustomFields(null, null, null, 0, []);
      }
    } else if (lengthList.length > 0 && connectionList.length === 0) {
      lengthList.forEach((length) => {
        if (customFieldsList.length > 0) {
          processCustomFields(null, length, null, 0, []);
        } else {
          generateCombinations(null, length, null, []);
        }
      });
    } else if (lengthList.length === 0 && connectionList.length > 0) {
      connectionList.forEach((connection) => {
        if (customFieldsList.length > 0) {
          processCustomFields(null, null, connection, 0, []);
        } else {
          generateCombinations(null, null, connection, []);
        }
      });
    } else {
      lengthList.forEach((length) => {
        connectionList.forEach((connection) => {
          if (customFieldsList.length > 0) {
            processCustomFields(null, length, connection, 0, []);
          } else {
            generateCombinations(null, length, connection, []);
          }
        });
      });
    }
  } else {
    capacityList.forEach((capacity) => {
      if (lengthList.length === 0 && connectionList.length === 0) {
        if (customFieldsList.length > 0) {
          processCustomFields(capacity, null, null, 0, []);
        } else {
          generateCombinations(capacity, null, null, []);
        }
      } else if (lengthList.length > 0 && connectionList.length === 0) {
        lengthList.forEach((length) => {
          if (customFieldsList.length > 0) {
            processCustomFields(capacity, length, null, 0, []);
          } else {
            generateCombinations(capacity, length, null, []);
          }
        });
      } else if (lengthList.length === 0 && connectionList.length > 0) {
        connectionList.forEach((connection) => {
          if (customFieldsList.length > 0) {
            processCustomFields(capacity, null, connection, 0, []);
          } else {
            generateCombinations(capacity, null, connection, []);
          }
        });
      } else {
        lengthList.forEach((length) => {
          connectionList.forEach((connection) => {
            if (customFieldsList.length > 0) {
              processCustomFields(capacity, length, connection, 0, []);
            } else {
              generateCombinations(capacity, length, connection, []);
            }
          });
        });
      }
    });
  }

  return variants;
}

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: true, data: product },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const {
      title,
      slug,
      description,
      contentBlocks,
      imageUrl,
      category,
      categoryOrder,
      showVariantsTable,
      priceType,
      basePrice,
      autoGenerate,
      capacities,
      capacityUnit,
      lengths,
      lengthUnit,
      connectionStyles,
      customFields,
      lemonSqueezyProductId,
      stripePaymentLink, // 🆕 ADD
    } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Title and slug are required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    // Update product in database
    const product = await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        contentBlocks: contentBlocks || null,
        imageUrl,
        category,
        categoryOrder,
        showVariantsTable: showVariantsTable ?? true,
        priceType: priceType || "base",
        basePrice: basePrice ? parseFloat(basePrice) : null,
        autoGenerate: autoGenerate || false,
        capacities,
        capacityUnit,
        lengths,
        lengthUnit,
        connectionStyles,
        customFields: customFields || null,
        lemonSqueezyProductId: lemonSqueezyProductId || null,
        lemonSqueezyStoreId: lemonSqueezyProductId
          ? process.env.LEMONSQUEEZY_STORE_ID
          : existingProduct.lemonSqueezyStoreId,
        lemonSqueezyStatus: lemonSqueezyProductId
          ? "published"
          : existingProduct.lemonSqueezyStatus,
        syncedAt: lemonSqueezyProductId ? new Date() : existingProduct.syncedAt,
        stripePaymentLink: stripePaymentLink || null, // 🆕 ADD
      },
    });

    // Regenerate variants if autoGenerate is enabled
    if (autoGenerate) {
      const hasAnyField =
        (capacities && capacities.trim()) ||
        (lengths && lengths.trim()) ||
        (connectionStyles && connectionStyles.trim()) ||
        (customFields &&
          Array.isArray(customFields) &&
          customFields.some((cf: any) => cf.name?.trim() && cf.values?.trim()));

      if (hasAnyField) {
        // SAVE EXISTING PRICES BEFORE DELETE
        const existingVariants = await prisma.productVariant.findMany({
          where: { productId: id },
          select: { modelNumber: true, price: true },
        });

        const priceMap = new Map(
          existingVariants.map((v) => [v.modelNumber, v.price])
        );

        // Delete existing variants from database
        await prisma.productVariant.deleteMany({
          where: { productId: id },
        });

        // Generate new variants
        const variantsToCreate = generateVariants(
          product.id,
          capacities,
          capacityUnit || "tons",
          lengths,
          lengthUnit || "ft",
          connectionStyles,
          customFields,
          title,
          priceType || "base",
          basePrice ? parseFloat(basePrice) : null
        );

        if (variantsToCreate.length > 0) {
          // RESTORE PRICES FROM OLD VARIANTS WHERE POSSIBLE
          const variantsWithRestoredPrices = variantsToCreate.map((variant) => {
            const existingPrice = priceMap.get(variant.modelNumber);
            return {
              ...variant,
              price:
                existingPrice !== undefined ? existingPrice : variant.price,
            };
          });

          await prisma.productVariant.createMany({
            data: variantsWithRestoredPrices,
          });

          console.log(
            `✓ Regenerated ${variantsWithRestoredPrices.length} variants in database`
          );
          console.log(
            `✓ Restored prices for ${
              Array.from(priceMap.keys()).filter((mn) =>
                variantsWithRestoredPrices.some((v) => v.modelNumber === mn)
              ).length
            } matching variants`
          );

          if (product.lemonSqueezyProductId) {
            console.log(
              "⚠ Variants regenerated in CMS. Use 'Sync Variants' button to link with Lemon Squeezy variants."
            );
          }
        }
      }
    } else {
      // Just update prices in database
      if (priceType === "base" && basePrice) {
        const variants = await prisma.productVariant.findMany({
          where: { productId: id },
        });

        for (const variant of variants) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              price: parseFloat(basePrice),
            },
          });
        }

        console.log(`✓ Updated ${variants.length} variant prices in database`);

        if (product.lemonSqueezyProductId) {
          console.log(
            "⚠ Prices updated in CMS. Use 'Sync Variants' button to sync prices with Lemon Squeezy."
          );
        }
      }
    }

    // Fetch updated product with variants
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(
      { success: true, data: updatedProduct },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Product with this slug already exists" },
        {
          status: 409,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    // Just delete from database
    // Note: Variants in LS must be deleted manually from LS dashboard
    await prisma.product.delete({
      where: { id },
    });

    if (product.lemonSqueezyProductId) {
      console.log(
        "⚠ Product deleted from CMS. Please manually delete variants from Lemon Squeezy dashboard if needed."
      );
    }

    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
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