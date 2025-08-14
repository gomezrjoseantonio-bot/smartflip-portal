
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function fmt(n:number){ return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pad(n:number){ return n.toString().padStart(2,'0'); }

export async function POST(req: NextRequest){
  const secret = req.headers.get("x-cron-secret");
  if(!secret || secret !== process.env.CRON_SECRET){
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE!;
  const supabase = createClient(url, service);

  // Periodo: mes anterior por defecto
  const now = new Date();
  const qYear = req.nextUrl.searchParams.get("year");
  const qMonth = req.nextUrl.searchParams.get("month"); // 1-12
  let year = qYear ? parseInt(qYear,10) : now.getUTCFullYear();
  let month = qMonth ? parseInt(qMonth,10) : (now.getUTCMonth()); // previous month
  if(!qMonth){ if(month===0){ month=12; year=year-1; } } // enero -> diciembre año anterior
  const periodStart = new Date(Date.UTC(year, month-1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0));

  const { data: loans, error: loanErr } = await supabase
    .from("loans")
    .select("id, investor_id, title, principal, annual_rate, start_date, end_date, payment_day, retention_pct, investors(email,nombre)")
    .eq("active", true);
  if(loanErr) return NextResponse.json({ ok:false, error: loanErr.message }, { status: 500 });

  let created = 0; let skipped = 0; let errors: any[] = [];

  for(const loan of loans || []){
    const start = new Date(loan.start_date);
    const end = loan.end_date ? new Date(loan.end_date) : null;

    const activeStart = periodStart < start ? start : periodStart;
    const activeEnd = (end && end < periodEnd) ? end : periodEnd;
    if(activeStart > activeEnd){ skipped++; continue; }

    const { data: existing, error: exErr } = await supabase
      .from("receipts").select("id")
      .eq("loan_id", loan.id)
      .eq("period_start", periodStart.toISOString().slice(0,10))
      .eq("period_end", periodEnd.toISOString().slice(0,10))
      .maybeSingle();
    if(exErr){ errors.push(exErr.message); continue; }
    if(existing){ skipped++; continue; }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const activeDays = Math.floor((activeEnd.getTime()-activeStart.getTime())/86400000)+1;
    const monthlyBase = Number(loan.principal) * Number(loan.annual_rate) / 12;
    const gross = monthlyBase * (activeDays / daysInMonth);
    const retentionPct = Number(loan.retention_pct);
    const retentionAmount = Math.round((gross * (retentionPct/100)) * 100) / 100;
    const net = Math.round((gross - retentionAmount) * 100)/100;

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const draw = (text:string, x:number, y:number, size=12)=>{ page.drawText(text, { x, y, size, font, color: rgb(0,0,0) }); };

    const headerY = 800;
    page.drawRectangle({ x: 0, y: headerY-20, width: 595.28, height: 40, color: rgb(1,0.333,0) });
    page.drawText("SmartFlip — Recibo de intereses", { x: 24, y: headerY-6, size: 16, font, color: rgb(1,1,1) });

    let y = 740;
    draw(`Inversor: ${loan.investors?.nombre || ""} <${loan.investors?.email || ""}>`, 24, y); y-=18;
    draw(`Préstamo: ${loan.title || loan.id}`, 24, y); y-=18;
    draw(`Periodo: ${pad(month)}/${year} (${periodStart.toISOString().slice(0,10)} a ${periodEnd.toISOString().slice(0,10)})`, 24, y); y-=18;
    draw(`Principal: ${fmt(Number(loan.principal))} € — TIN anual: ${(Number(loan.annual_rate)*100).toFixed(2)} %`, 24, y); y-=18;
    draw(`Días en periodo: ${activeDays}/${daysInMonth}`, 24, y); y-=24;

    draw(`Interés bruto: ${fmt(gross)} €`, 24, y, 13); y-=18;
    draw(`Retención (${retentionPct.toFixed(2)} %): -${fmt(retentionAmount)} €`, 24, y, 13); y-=18;
    draw(`Importe neto a percibir: ${fmt(net)} €`, 24, y, 13); y-=24;
    draw(`Fecha de pago prevista: día ${loan.payment_day} del mes`, 24, y); y-=18;
    draw(`Documento generado automáticamente.`, 24, y);

    const pdfBytes = await pdf.save();

    const folder = `${loan.investor_id}/recibos/${year}`;
    const name = `recibo_${year}-${pad(month)}_${loan.id}.pdf`;
    const path = `${folder}/${name}`;
    const { error: upErr } = await supabase.storage.from("docs").upload(path, new Blob([pdfBytes], { type: "application/pdf" }), { upsert: true });
    if(upErr){ errors.push(upErr.message); continue; }

    const periodStartStr = periodStart.toISOString().slice(0,10);
    const periodEndStr = periodEnd.toISOString().slice(0,10);

    const { error: insR } = await supabase.from("receipts").insert({
      investor_id: loan.investor_id,
      loan_id: loan.id,
      period_start: periodStartStr,
      period_end: periodEndStr,
      gross_interest: gross.toFixed(2),
      retention_pct: retentionPct.toFixed(2),
      retention_amount: retentionAmount.toFixed(2),
      net_amount: net.toFixed(2),
      storage_path: path
    });
    if(insR){ errors.push(insR.message); continue; }

    const { error: insD } = await supabase.from("documents").insert({
      investor_id: loan.investor_id,
      tipo: "recibo",
      anio: year,
      path,
      nombre_mostrar: `Recibo ${year}-${pad(month)} (${loan.title || loan.id}).pdf`
    });
    if(insD){ errors.push(insD.message); continue; }

    created++;
  }

  return NextResponse.json({ ok: true, created, skipped, errors, period: { year, month } });
}
