// FILE: app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Block inactive users
    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: "Your account is pending approval. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    });

    // Test token immediately
    const testVerify = verifyToken(token);
    console.log("Token generated and tested:", {
      generated: !!token,
      verified: !!testVerify,
      email: testVerify?.email,
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isActive: admin.isActive,
        },
      },
      { status: 200 }
    );

    // Set cookie directly on response
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log("Cookie set, redirecting to /admin");

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
