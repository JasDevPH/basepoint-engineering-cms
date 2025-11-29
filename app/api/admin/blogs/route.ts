// FILE: app/api/admin/blogs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      content,
      contentBlocks,
      excerpt,
      imageUrl,
      author,
      publishedAt,
      featured,
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

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content: content || "",
        contentBlocks: contentBlocks || null,
        excerpt,
        imageUrl,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        featured: featured || false,
      },
    });

    return NextResponse.json(
      { success: true, data: blog },
      {
        status: 201,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  } catch (error: any) {
    console.error("Error creating blog:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Blog with this slug already exists" },
        {
          status: 409,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
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
