// FILE: app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// Helper function to generate variants
function generateVariants(
  productId: string,
  capacities: string,
  capacityUnit: string,
  lengths: string | null,
  lengthUnit: string,
  connectionStyles: string | null,
  productTitle: string
) {
  const capacityList = capacities
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
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

  const variants: any[] = [];

  if (lengthList.length === 0 && connectionList.length === 0) {
    // Only capacities
    capacityList.forEach((capacity) => {
      variants.push({
        productId,
        capacity: `${capacity} ${capacityUnit}`,
        modelNumber: `${productTitle
          .substring(0, 3)
          .toUpperCase()}-${capacity}${capacityUnit}`,
      });
    });
  } else if (lengthList.length > 0 && connectionList.length === 0) {
    // Capacities x Lengths
    capacityList.forEach((capacity) => {
      lengthList.forEach((length) => {
        variants.push({
          productId,
          capacity: `${capacity} ${capacityUnit}`,
          length: `${length} ${lengthUnit}`,
          modelNumber: `${productTitle
            .substring(0, 3)
            .toUpperCase()}-${capacity}${capacityUnit}-${length}${lengthUnit}`,
        });
      });
    });
  } else if (lengthList.length === 0 && connectionList.length > 0) {
    // Capacities x Connections
    capacityList.forEach((capacity) => {
      connectionList.forEach((connection) => {
        variants.push({
          productId,
          capacity: `${capacity} ${capacityUnit}`,
          endConnection: connection,
          modelNumber: `${productTitle
            .substring(0, 3)
            .toUpperCase()}-${capacity}${capacityUnit}-${connection}`,
        });
      });
    });
  } else {
    // Capacities x Lengths x Connections
    capacityList.forEach((capacity) => {
      lengthList.forEach((length) => {
        connectionList.forEach((connection) => {
          variants.push({
            productId,
            capacity: `${capacity} ${capacityUnit}`,
            length: `${length} ${lengthUnit}`,
            endConnection: connection,
            modelNumber: `${productTitle
              .substring(0, 3)
              .toUpperCase()}-${capacity}${capacityUnit}-${length}${lengthUnit}-${connection}`,
          });
        });
      });
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
      autoGenerate,
      capacities,
      capacityUnit,
      lengths,
      lengthUnit,
      connectionStyles,
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
        autoGenerate: autoGenerate || false,
        capacities,
        capacityUnit,
        lengths,
        lengthUnit,
        connectionStyles,
      },
    });

    // Auto-generate variants if enabled
    if (autoGenerate && capacities) {
      const variantsToCreate = generateVariants(
        product.id,
        capacities,
        capacityUnit || "tons",
        lengths,
        lengthUnit || "ft",
        connectionStyles,
        title
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
