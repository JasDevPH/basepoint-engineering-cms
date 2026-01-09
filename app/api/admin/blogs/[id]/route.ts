// FILE: app/api/admin/blogs/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// GET single blog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        {
          status: 404,
          headers: corsHeaders(request.headers.get("origin") || undefined),
        }
      );
    }

    return NextResponse.json(
      { success: true, data: blog },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blog" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// PUT update blog
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
      excerpt,
      content,
      contentBlocks,
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

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        contentBlocks: contentBlocks || null,
        imageUrl,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        featured: featured ?? false,
      },
    });

    return NextResponse.json(
      { success: true, data: blog },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error: any) {
    console.error("Error updating blog:", error);

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
      { success: false, error: "Failed to update blog" },
      {
        status: 500,
        headers: corsHeaders(request.headers.get("origin") || undefined),
      }
    );
  }
}

// DELETE blog
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.blog.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Blog deleted successfully" },
      { headers: corsHeaders(request.headers.get("origin") || undefined) }
    );
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete blog" },
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
