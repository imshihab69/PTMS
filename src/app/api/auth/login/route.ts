import { NextRequest, NextResponse } from "next/server";
import { validateCredentials } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = await validateCredentials(username, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials or account deactivated" }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ user });
}
