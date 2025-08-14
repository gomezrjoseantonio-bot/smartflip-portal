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
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Tipado simple
type Loan = {
  id: string;
  investor_id: string;
  title: string | null;
  principal: number;
  annual_rate: number;
  start_date: string;
  end_date: string | null;
  payment_day: number;
  retention_pct: number;
  active: boolean;
};

// POST /api/cron/generate-receipts?year=2025&month=7
export async function POST(req: NextRequest) {
  // Seguridad del cron
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Supabase con service role (solo en servidor)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE!;
  const supabase = createClient(url, service);

  // ---- Periodo a generar ----
  const now = new Date();
  const qYear = req.nextUrl.searchParams.get("year");
  const qMonth = req.nextUrl.searchParams.get("month"); // 1..12
  let year: number;
  let month: number;

  if (qYear && qMonth) {
    year = parseInt(qYear, 10);
    month = parseInt(qMonth, 10);
  } else {
    // Mes anterior por defecto (UTC)
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    year = prev.getUTCFullYear();
    month = prev.getUTCMonth() + 1;
  }

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0)); // último día del mes

  // ---- Cargar préstamos activos ----
  const { data: loansRaw, error: loanErr } = await supabase
    .from("loans")
    .select(
      "id, investor_id, title, principal, annual_rate, start_date, end_date, payment_day, retention_pct, active"
    )
    .eq("active", true);

  if (loanErr) {
    return NextResponse.json({ ok: false, error: loanErr.message }, { status: 500 });
  }

  const loans = (loansRaw as Loan[]) || [];

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const loan of loans) {
    try {
      const start = new Date(loan.start_date);
      const end = loan.end_date ? new Date(loan.end_date) : null;

      // Solape con el periodo
      const activeStart = new Date(Math.max(periodStart.getTime(), start.getTime()));
      const activeEnd = new Date(Math.min(periodEnd.getTime(), end ? end.getTime() : periodEnd.getTime()));
      if (activeStart.getTime() > activeEnd.getTime()) {
        skipped++;
        continue;
      }

      // ¿Ya existe?
      const { data: existing, error: exErr } = await supabase
        .from("receipts")
        .select("id")
        .eq("loan_id", loan.id)
        .eq("period_start", toDateStr(periodStart))
        .eq("period_end", toDateStr(periodEnd))
        .maybeSingle();
      if (exErr) { errors.push(exErr.message); continue; }
      if (existing) { skipped++; continue; }

      // Cálculo de intereses (prorrata por días)
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const activeDays = Math.floor((activeEnd.getTime() - activeStart.getTime()) / 86400000) + 1;

      const principal = Number(loan.principal);
      const annualRate = Number(loan.annual_rate);
      const monthlyBase = principal * annualRate / 12;
      const gross = monthlyBase * (activeDays / daysInMonth);

      const retentionPct = Number(loan.retention_pct);
      const retentionAmount = Math.round(gross * (retentionPct / 100) * 100) / 100;
      const net = Math.round((gross - retentionAmount) * 100) / 100;

      // ---- Generar PDF ----
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]); // A4
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const draw = (text: string, x: number, y: number, size = 12) => {
        page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
      };

      const headerY = 800;
      page.drawRectangle({ x: 0, y: headerY - 20, width: 595.28, height: 40, color: rgb(1, 0.333, 0) });
      page.drawText("SmartFlip — Recibo de intereses", {
        x: 24, y: headerY - 6, size: 16, font, color: rgb(1, 1, 1)
      });

      let y = 740;
      draw(`Inversor ID: ${loan.investor_id}`, 24, y); y -= 18;
      draw(`Préstamo: ${loan.title || loan.id}`, 24, y); y -= 18;
      draw(`Periodo: ${pad(month)}/${year} (${toDateStr(periodStart)} a ${toDateStr(periodEnd)})`, 24, y); y -= 18;
      draw(`Principal: ${fmt(principal)} € — TIN anual: ${(annualRate * 100).toFixed(2)} %`, 24, y); y -= 18;
      draw(`Días en periodo: ${activeDays}/${daysInMonth}`, 24, y); y -= 24;

      draw(`Interés bruto: ${fmt(gross)} €`, 24, y, 13); y -= 18;
      draw(`Retención (${retentionPct.toFixed(2)} %): -${fmt(retentionAmount)} €`, 24, y, 13); y -= 18;
      draw(`Importe neto a percibir: ${fmt(net)} €`, 24, y, 13); y -= 24;
      draw(`Fecha de pago prevista: día ${loan.payment_day} del mes`, 24, y); y -= 18;
      draw(`Documento generado automáticamente.`, 24, y);

      const pdfBytes = await pdf.save();
      const fileBlob = new Blob([pdfBytes], { type: "application/pdf" });

      // ---- Subir a Storage ----
      const folder = `${loan.investor_id}/recibos/${year}`;
      const name = `recibo_${year}-${pad(month)}_${loan.id}.pdf`;
      const path = `${folder}/${name}`;

      const { error: upErr } = await supabase
        .storage
        .from("docs")
        .upload(path, fileBlob, { upsert: true, contentType: "application/pdf" });
      if (upErr) { errors.push(upErr.message); continue; }

      // ---- Insertar en receipts y documents ----
      const periodStartStr = toDateStr(periodStart);
      const periodEndStr = toDateStr(periodEnd);

      const { error: insR } = await supabase.from("receipts").insert({
        investor_id: loan.investor_id,
        loan_id: loan.id,
        period_start: periodStartStr,
        period_end: periodEndStr,
        gross_interest: gross.toFixed(2),
        retention_pct: retentionPct.toFixed(2),
        retention_amount: retentionAmount.toFixed(2),
        net_amount: net.toFixed(2),
        storage_path: path,
        currency: "EUR",
      });
      if (insR) { errors.push(insR.message); continue; }

      const { error: insD } = await supabase.from("documents").insert({
        investor_id: loan.investor_id,
        tipo: "recibo",
        anio: year,
        path,
        nombre_mostrar: `Recibo ${year}-${pad(month)} (${loan.title || loan.id}).pdf`,
      });
      if (insD) { errors.push(insD.message); continue; }

      created++;
    } catch (e: any) {
      errors.push(e?.message || String(e));
      continue;
    }
  }

  return NextResponse.json({
    ok: true,
    period: { year, month },
    created,
    skipped,
    errors,
  });
}
