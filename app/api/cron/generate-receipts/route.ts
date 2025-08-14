// app/api/cron/generate-receipts/route.ts
// ------------------------------------------------------------
// Genera recibos mensuales (PDF) y los sube a Supabase Storage.
// Inserta el índice en public.documents.
//
// - Ejecutable por CRON (Vercel) o manualmente con ?secret=... 
// - Server-only (NodeJS) y usando Service Role si está disponible.
//
// Requisitos en Vercel (Environment Variables):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE     (recomendado)
//   CRON_SECRET               (para llamada manual)
// ------------------------------------------------------------

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ---------- utils ----------
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Math.round(n * 100) / 100
  );

// Limpia tildes/ñ/espacios/etc. para claves de Storage
const safeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();

// Calcula el periodo del mes anterior en UTC (1 a último día)
function previousMonthPeriodUTC(now = new Date()) {
  const firstThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const firstPrev = new Date(firstThis);
  firstPrev.setUTCMonth(firstPrev.getUTCMonth() - 1);
  const year = firstPrev.getUTCFullYear();
  const month = firstPrev.getUTCMonth() + 1; // 1..12
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // último día mes anterior
  const daysInMonth = end.getUTCDate();
  return { year, month, start, end, daysInMonth };
}

// ---------- PDF sencillo de recibo ----------
async function buildReceiptPdf(params: {
  investorEmail: string;
  investorNombre?: string | null;
  loanTitle?: string | null;
  loanId: string;
  principal: number;
  annualRate: number; // 0.08 = 8%
  periodStart: Date;
  periodEnd: Date;
  month: number; // 1..12
  year: number;
  interestAmount: number;
}) {
  const {
    investorEmail,
    investorNombre,
    loanTitle,
    loanId,
    principal,
    annualRate,
    periodStart,
    periodEnd,
    month,
    year,
    interestAmount,
  } = params;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 vertical
  const font = await doc.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const draw = (text: string, size = 12, x = 40) => {
    page.drawText(text, { x, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 6;
  };

  draw("SMARTFLIP — Recibo de intereses", 20);
  draw(" ");
  draw(`Inversor: ${investorNombre || ""} <${investorEmail}>`, 12);
  draw(`Préstamo: ${loanTitle || loanId}`, 12);
  draw(
    `Periodo: ${pad(month)}/${year} (${periodStart.toISOString().slice(0, 10)} a ${periodEnd
      .toISOString()
      .slice(0, 10)})`,
    12
  );
  draw(`Principal: ${fmt(principal)} — TIN anual: ${(annualRate * 100).toFixed(2)} %`, 12);
  draw(`Interés del periodo: ${fmt(interestAmount)}`, 14);
  draw(" ");
  draw("Este documento se ha generado automáticamente por el portal de inversores de SmartFlip.", 10);
  draw(" ");

  return await doc.save(); // Uint8Array
}

// ---------- Handler ----------
export async function GET(req: NextRequest) {
  try {
    // 1) Autorización: cron (x-vercel-cron) o llamada manual con ?secret=CRON_SECRET
    const url = new URL(req.url);
    const qSecret = url.searchParams.get("secret") || "";
    const envSecret = process.env.CRON_SECRET || "";
    const fromCron = req.headers.has("x-vercel-cron");

    if (!fromCron && (!envSecret || qSecret !== envSecret)) {
      return NextResponse.json({ ok: false, reason: "bad-secret" }, { status: 401 });
    }

    // 2) Supabase client (service role si existe; si no, anon)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl) return NextResponse.json({ ok: false, error: "supabaseUrl missing" }, { status: 500 });
    const supabaseKey = service ?? anon;
    if (!supabaseKey) return NextResponse.json({ ok: false, error: "supabaseKey missing" }, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3) Periodo objetivo: mes anterior
    const { year, month, start: periodStart, end: periodEnd, daysInMonth } = previousMonthPeriodUTC();

    // 4) Cargar préstamos activos (incluye info del inversor)
    //    Ajusta los nombres de columnas si en tu DB difieren.
    const { data: loans, error: loansError } = await supabase
      .from("loans")
      .select(
        "id, investor_id, principal, annual_rate, start_date, end_date, title, investors(email,nombre)"
      )
      .returns<any[]>();

    if (loansError) {
      return NextResponse.json({ ok: false, error: loansError.message }, { status: 500 });
    }

    let generated = 0;
    let skippedExisting = 0;
    let skippedInactive = 0;
    const results: Array<{ loanId: string; path?: string; reason?: string }> = [];

    for (const loan of loans || []) {
      const loanId: string = String(loan.id);
      const investorId: string = String(loan.investor_id);

      // Rango activo del préstamo vs periodo del recibo
      const sDate = loan.start_date ? new Date(loan.start_date) : null;
      const eDate = loan.end_date ? new Date(loan.end_date) : null;

      const activeStart = sDate && sDate > periodStart ? sDate : periodStart;
      const activeEnd = eDate && eDate < periodEnd ? eDate : periodEnd;

      if (activeStart > activeEnd) {
        skippedInactive++;
        results.push({ loanId, reason: "inactive-in-period" });
        continue;
      }

      // ¿Ya existe el recibo de ese préstamo para ese mes?
      const baseName = safeName(
        `recibo_${year}-${pad(month)}_${loan.title ? String(loan.title) : loanId}.pdf`
      );
      const path = `${investorId}/recibo/${year}/${baseName}`;

      const { data: existing, error: existErr } = await supabase
        .from("documents")
        .select("id")
        .eq("investor_id", investorId)
        .eq("tipo", "recibo")
        .eq("anio", year)
        .eq("path", path)
        .limit(1);

      if (existErr) {
        return NextResponse.json({ ok: false, error: existErr.message }, { status: 500 });
      }
      if (existing && existing.length > 0) {
        skippedExisting++;
        results.push({ loanId, path, reason: "already-exists" });
        continue;
      }

      // Interés prorrateado por días activos dentro del mes objetivo
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysActive =
        Math.floor((activeEnd.getTime() - activeStart.getTime()) / msPerDay) + 1; // inclusivo
      const principal = Number(loan.principal) || 0;
      const annualRate = Number(loan.annual_rate) || 0;
      const interest = (principal * annualRate * (daysActive / daysInMonth)) / 12;

      // Construir PDF
      const pdfBytes = await buildReceiptPdf({
        investorEmail: loan.investors?.email || "",
        investorNombre: loan.investors?.nombre || null,
        loanTitle: loan.title || null,
        loanId,
        principal,
        annualRate,
        periodStart,
        periodEnd,
        month,
        year,
        interestAmount: interest,
      });

      // Subir a Storage (bucket 'docs')
      const up = await supabase.storage
        .from("docs")
        .upload(path, pdfBytes, { upsert: true, contentType: "application/pdf" });

      if (up.error) {
        return NextResponse.json({ ok: false, error: up.error.message, path }, { status: 500 });
      }

      // Insertar índice en public.documents
      const ins = await supabase.from("documents").insert({
        investor_id: investorId,
        tipo: "recibo",
        anio: year,
        path,
        nombre_mostrar: baseName,
      });

      if (ins.error) {
        return NextResponse.json({ ok: false, error: ins.error.message, path }, { status: 500 });
      }

      generated++;
      results.push({ loanId, path });
    }

    return NextResponse.json({
      ok: true,
      period: { year, month, from: periodStart.toISOString(), to: periodEnd.toISOString(), daysInMonth },
      counters: { generated, skippedExisting, skippedInactive, totalLoans: loans?.length || 0 },
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unhandled error" }, { status: 500 });
  }
}
