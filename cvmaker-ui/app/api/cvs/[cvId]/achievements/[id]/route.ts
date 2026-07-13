import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/mock-store";

type Ctx = { params: Promise<{ cvId: string; id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { cvId, id } = await params;
  const body = await req.json();
  const idx = store.achievements.findIndex(a => a.id === id && a.cvId === cvId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  store.achievements[idx] = { ...store.achievements[idx], ...body, id, cvId };
  return NextResponse.json(store.achievements[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { cvId, id } = await params;
  const idx = store.achievements.findIndex(a => a.id === id && a.cvId === cvId);
  if (idx !== -1) store.achievements.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
