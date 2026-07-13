import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "healthy", mode: "mock", timestamp: new Date().toISOString() });
}
