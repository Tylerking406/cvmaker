import { NextRequest, NextResponse } from "next/server";
import { store, newId } from "@/lib/mock-store";

type Ctx = { params: Promise<{ cvId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  return NextResponse.json(
    store.skills.filter(s => s.cvId === cvId).sort((a, b) => a.orderIndex - b.orderIndex)
  );
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  const body = await req.json();
  const entry = { id: newId(), cvId, ...body };
  store.skills.push(entry);
  return NextResponse.json(entry, { status: 201 });
}
