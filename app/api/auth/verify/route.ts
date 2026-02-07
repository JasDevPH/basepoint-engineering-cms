// FILE: app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // DB lookup to confirm user still exists and is active
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      const response = NextResponse.json(
        { success: false, error: "Account is inactive or not found" },
        { status: 401 }
      );
      response.cookies.delete("admin-token");
      return response;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          adminId: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isActive: admin.isActive,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
