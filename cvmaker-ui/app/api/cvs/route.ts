import { NextRequest, NextResponse } from "next/server";
import { store, newId, now } from "@/lib/mock-store";

export function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const cvs = userId ? store.cvs.filter(c => c.userId === userId) : store.cvs;
  return NextResponse.json(cvs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const cv = {
    id: newId(),
    userId: body.userId,
    title: body.title ?? "Untitled CV",
    template: body.template ?? "ats-classic",
    createdAt: now(),
    updatedAt: now(),
  };
  store.cvs.push(cv);
  return NextResponse.json(cv, { status: 201 });
}
