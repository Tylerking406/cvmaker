import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/mock-store";

type Ctx = { params: Promise<{ cvId: string; id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { cvId, id } = await params;
  const idx = store.achievements.findIndex(a => a.id === id && a.cvId === cvId);
  if (idx !== -1) store.achievements.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
