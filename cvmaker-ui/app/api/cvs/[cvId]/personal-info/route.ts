import { NextRequest, NextResponse } from "next/server";
import { store, newId } from "@/lib/mock-store";

type Ctx = { params: Promise<{ cvId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  const info = store.personalInfo.find(p => p.cvId === cvId);
  if (!info) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(info);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  const body = await req.json();
  const idx = store.personalInfo.findIndex(p => p.cvId === cvId);
  if (idx === -1) {
    const info = { id: newId(), cvId, ...body };
    store.personalInfo.push(info);
    return NextResponse.json(info, { status: 201 });
  }
  store.personalInfo[idx] = { ...store.personalInfo[idx], ...body, cvId };
  return NextResponse.json(store.personalInfo[idx]);
}
