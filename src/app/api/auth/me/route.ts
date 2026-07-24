import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json({ user: null, revoked: true }, { status: 403 });
  }
  return NextResponse.json({ user });
}
