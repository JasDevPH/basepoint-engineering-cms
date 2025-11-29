// FILE: app/api/admin/products/[id]/route.ts
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ capacity: "asc" }, { length: "asc" }],
        },
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
      autoGenerate,
      capacities,
      capacityUnit,
      lengths,
      lengthUnit,
      connectionStyles,
    } = body;

    // Update product
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
        autoGenerate: autoGenerate || false,
        capacities,
        capacityUnit,
        lengths,
        lengthUnit,
        connectionStyles,
      },
    });

    // Regenerate variants if auto-generate is enabled
    if (autoGenerate && capacities) {
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
      console.log(`✓ Deleted old variants for product: ${title}`);

      // Generate new variants
      const variantsToCreate = generateVariants(
        id,
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
          `✓ Created ${variantsToCreate.length} new variants for product: ${title}`
        );
      }
    }

    // Fetch product with updated variants
    const productWithVariants = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(
      { success: true, data: productWithVariants },
      {
        status: 200,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        {
          status: 404,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error: any) {
    console.error("Error deleting product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

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
