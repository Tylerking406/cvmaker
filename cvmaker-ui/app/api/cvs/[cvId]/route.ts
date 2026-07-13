import { NextRequest, NextResponse } from "next/server";
import { store, now } from "@/lib/mock-store";

type Ctx = { params: Promise<{ cvId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  const cv = store.cvs.find(c => c.id === cvId);
  if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cv);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  const body = await req.json();
  const idx = store.cvs.findIndex(c => c.id === cvId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  store.cvs[idx] = { ...store.cvs[idx], title: body.title ?? store.cvs[idx].title, template: body.template ?? store.cvs[idx].template, updatedAt: now() };
  return NextResponse.json(store.cvs[idx]);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { cvId } = await params;
  const idx = store.cvs.findIndex(c => c.id === cvId);
  if (idx !== -1) {
    store.cvs.splice(idx, 1);
    const clean = (arr: { cvId: string }[]) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i].cvId === cvId) arr.splice(i, 1); };
    clean(store.personalInfo);
    clean(store.workExperience);
    clean(store.education);
    clean(store.skills);
    clean(store.projects);
    clean(store.certifications);
    clean(store.achievements);
  }
  return new NextResponse(null, { status: 204 });
}
