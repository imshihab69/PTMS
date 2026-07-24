import { NextResponse } from "next/server";
import { seedMasterAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await seedMasterAdmin();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
