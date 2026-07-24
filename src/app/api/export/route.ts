import { NextResponse } from "next/server";
import { db } from "@/db";
import { phoneRecords } from "@/db/schema";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getSession();
  if (!session || !session.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(phoneRecords).orderBy(phoneRecords.phoneNumber);

  const wsData = rows.map((r) => ({
    "Phone Number": r.phoneNumber,
    "IDF Pair": r.idfPair || "",
    "IDF Cable": r.idfCable || "",
    "MDF Pair": r.mdfPair || "",
    "MDF Block": r.mdfBlock || "",
    Department: r.department || "",
    Status: (r.status || "active").toUpperCase(),
    Note: r.note || "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 18 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 20 },
    { wch: 14 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Phone Records");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  await logAudit({
    action: "EXPORT",
    entityType: "phone_record",
    entityId: "all",
    userId: session.id,
    userName: session.fullName,
    before: null,
    after: null,
    description: `${session.fullName} exported ${rows.length} phone records to XLSX`,
  });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PTMS_Phone_Records_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
