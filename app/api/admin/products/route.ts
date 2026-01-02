// FILE: app/api/admin/products/route.ts
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

  // Parse custom fields
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

  // Helper function to generate combinations recursively
  const generateCombinations = (
    capacity: string | null,
    length: string | null,
    connection: string | null,
    customFieldsData: Array<{ name: string; value: string }>
  ) => {
    // Build custom fields object
    const customFieldsObj: Record<string, string> = {};
    customFieldsData.forEach((cf) => {
      customFieldsObj[cf.name] = cf.value;
    });

    // Build model number
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

  // Recursive function to handle custom fields combinations
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

  // Main generation logic
  if (capacityList.length === 0) {
    // No capacity specified - generate from other fields
    if (lengthList.length === 0 && connectionList.length === 0) {
      // Only custom fields
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
    // Original logic with capacity
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

export async function POST(request: NextRequest) {
  try {
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

    // Create product
    const product = await prisma.product.create({
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
      },
    });

    // Auto-generate variants if enabled and at least one field has values
    if (autoGenerate) {
      const hasAnyField =
        (capacities && capacities.trim()) ||
        (lengths && lengths.trim()) ||
        (connectionStyles && connectionStyles.trim()) ||
        (customFields &&
          Array.isArray(customFields) &&
          customFields.some((cf: any) => cf.name?.trim() && cf.values?.trim()));

      if (hasAnyField) {
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
          await prisma.productVariant.createMany({
            data: variantsToCreate,
          });
          console.log(
            `✓ Created ${variantsToCreate.length} variants for product: ${title}`
          );
        }
      }
    }

    // Fetch product with variants to return
    const productWithVariants = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(
      { success: true, data: productWithVariants },
      {
        status: 201,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);

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
      { success: false, error: "Failed to create product" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: products },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
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
