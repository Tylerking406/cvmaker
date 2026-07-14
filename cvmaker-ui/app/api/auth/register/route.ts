import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { store, newId, now } from "@/lib/mock-store";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();
  if (store.users.find(u => u.email === normalised)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: newId(), email: normalised, name: name.trim(), passwordHash, createdAt: now() };
  store.users.push(user);

  // Create a blank CV automatically for the new user
  const cvId = newId();
  store.cvs.push({
    id: cvId,
    userId: user.id,
    title: `${name.trim()}'s CV`,
    template: "ats-classic",
    createdAt: now(),
    updatedAt: now(),
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
