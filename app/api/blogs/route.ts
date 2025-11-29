// FILE: app/api/blogs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function GET(request: NextRequest) {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: {
        publishedAt: "desc",
      },
    });

    return NextResponse.json(
      { success: true, data: blogs },
      {
        status: 200,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
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
