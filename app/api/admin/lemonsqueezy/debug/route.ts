// FILE: app/api/admin/lemonsqueezy/debug/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  return NextResponse.json({
    configured: {
      apiKey: apiKey ? "✓ Present" : "✗ Missing",
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 30) + "..." : "N/A",
      apiKeyFormat: apiKey?.startsWith("eyJ")
        ? "✓ Valid JWT format"
        : "✗ Invalid format",
      storeId: storeId ? `✓ Present (${storeId})` : "✗ Missing",
      webhookSecret: webhookSecret ? "✓ Present" : "✗ Missing",
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      allKeys: Object.keys(process.env).filter((k) => k.includes("LEMON")),
    },
  });
}
