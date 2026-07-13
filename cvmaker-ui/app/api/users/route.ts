import { NextResponse } from "next/server";
import { store, newId } from "@/lib/mock-store";

export function GET() {
  return NextResponse.json(store.users);
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = typeof body === "string" ? body : (body.email ?? "");
  const existing = store.users.find(u => u.email === email);
  if (existing) return NextResponse.json(existing);
  const user = { id: newId(), email };
  store.users.push(user);
  return NextResponse.json(user, { status: 201 });
}
