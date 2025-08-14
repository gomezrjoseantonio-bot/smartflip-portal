import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Helpers
function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// POST /api/cron/generate-receipts?year=2025&month=7
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE!;
  const supabase = createClient(url, service);

  // --- Periodo a generar ---
  const now = new Date();
  const qYear = req.nextUrl.searchParams.get("year");
  const qMonth = req.nextUrl.searchParams.get("month"); // 1..12

  let year: number;
  let month: number; // 1..12

  if (qYear && qMonth) {
    year = parseInt(qYear, 10);
    month = parseInt(qMonth, 10);
  } else {
    // Mes anterior (en UTC para evitar líos de zona horaria)
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    year = prev.getUTCFullYear();
    month = prev.getUTCMonth() + 1;
  }

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0)); // último día del mes

  // --- Cargar préstamos activos ---
  const { data: loans, error: loanErr } = await supabase
    .from("loans")
    .select(
      "id, investor_id, title, principal, annual_rate, start_date, end_date, payment_day, retention_pct"
    )
    .eq("active", true);

  if (loanErr) {
    return NextResponse.json({ ok: false, error: loanErr.message }, { status: 500 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Utilidades de fecha a string YYYY-MM-DD
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  for (const loan of loans || []) {
    try {
      const start = new Date(loan.start_date as unknown as string);
      const end = loan.end_date ? new Date(loan.end_date as unknown as string) : null;

      // ¿Solapa el préstamo con el periodo?
      const activeStart = periodStart < start ? start : periodStart;
      const activeEnd = end && end < periodEnd ? end : periodEnd;
      if (activeStart > activeEnd) {
        skipped++;
        continue;
      }

      // ¿Ya existe recibo para ese pr

