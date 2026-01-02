// FILE: app/api/admin/services/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// GET all services
export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(
      { success: true, data: services },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// POST create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, icon, order, published, contentBlocks } =
      body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Title and slug are required" },
        {
          status: 400,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    const service = await prisma.service.create({
      data: {
        title,
        slug,
        excerpt,
        icon,
        order,
        published: published ?? true,
        contentBlocks: contentBlocks || null,
      },
    });

    return NextResponse.json(
      { success: true, data: service },
      {
        status: 201,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error creating service:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Service with this slug already exists" },
        {
          status: 409,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create service" },
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
