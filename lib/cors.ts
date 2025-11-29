// FILE: lib/cors.ts
import Cors from "cors";
import { NextRequest, NextResponse } from "next/server";

const cors = Cors({
  origin: [
    "http://localhost:3000",
    "https://basepoint-engineering-249728.webflow.io",
    "https://preview.webflow.com",
    "https://webflow.com",
    /\.webflow\.io$/, // Allow all webflow.io subdomains
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

export function runCorsMiddleware(req: NextRequest) {
  return new Promise((resolve, reject) => {
    cors(req as any, {} as any, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export function corsHeaders(origin?: string) {
  // Check if origin is allowed
  const allowedOrigins = [
    "http://localhost:3000",
    "https://basepoint-engineering-249728.webflow.io",
    "https://preview.webflow.com",
    "https://webflow.com",
  ];

  const isAllowed = allowedOrigins.some(
    (allowed) => origin?.includes(allowed) || origin?.endsWith(".webflow.io")
  );

  return {
    "Access-Control-Allow-Origin": isAllowed && origin ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}
