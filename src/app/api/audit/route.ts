import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, users } from "@/db/schema"; // ← غيرنا إلى auditLog
import { getSession } from "@/lib/session";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();

  // 1. التحقق من وجود جلسة نشطة
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. (اختياري) طباعة الجلسة لمعرفة محتوياتها
  console.log("🔍 Session data:", session);

  // 3. جلب دور المستخدم من قاعدة البيانات باستخدام session.username
  const userRecord = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.username, session.username)) // تأكد من أن session.username صحيح
    .limit(1);

  // 4. إذا لم يكن المستخدم موجوداً أو ليس مديراً، امنع الوصول
  if (!userRecord.length || userRecord[0].role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5. إذا كان Admin، أجلب سجل التغييرات وأعده
  const rows = await db
    .select()
    .from(auditLog) // ← استخدمنا auditLog هنا
    .orderBy(desc(auditLog.createdAt)) // ← createdAt هو الاسم الصحيح في الـ schema
    .limit(200);

  return NextResponse.json({ entries: rows });
}