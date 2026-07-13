import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/mock-store";

type Ctx = { params: Promise<{ cvId: string; id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { cvId, id } = await params;
  const body = await req.json();
  const idx = store.skills.findIndex(s => s.id === id && s.cvId === cvId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  store.skills[idx] = { ...store.skills[idx], ...body, id, cvId };
  return NextResponse.json(store.skills[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { cvId, id } = await params;
  const idx = store.skills.findIndex(s => s.id === id && s.cvId === cvId);
  if (idx !== -1) store.skills.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
