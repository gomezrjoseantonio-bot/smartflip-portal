import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getServiceClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServiceClient();

    const { data: investor } = await supabase
      .from("investors")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!investor) {
      return NextResponse.json({
        totalInvested: 0,
        totalEarnings: 0,
        avgRate: 0,
        nextPayment: null,
        thisMonthEarnings: 0,
        monthlyData: [],
        loans: [],
        recentReceipts: [],
      });
    }

    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("investor_id", investor.id);

    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("investor_id", investor.id)
      .eq("tipo", "recibo")
      .order("uploaded_at", { ascending: false })
      .limit(5);

    const loansData = loans || [];
    const totalInvested = loansData.reduce((sum: number, l: any) => sum + (l.principal || 0), 0);
    const avgRate = loansData.length > 0
      ? loansData.reduce((sum: number, l: any) => sum + (l.rate || 0), 0) / loansData.length
      : 0;

    const { data: allReceipts } = await supabase
      .from("receipts")
      .select("*")
      .eq("investor_id", investor.id)
      .order("periodo", { ascending: false });

    const receiptsData = allReceipts || [];
    const totalEarnings = receiptsData.reduce((sum: number, r: any) => sum + (r.neto || r.bruto || 0), 0);

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthEarnings = receiptsData
      .filter((r: any) => r.periodo?.startsWith(thisMonth))
      .reduce((sum: number, r: any) => sum + (r.neto || r.bruto || 0), 0);

    const monthlyMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, 0);
    }
    receiptsData.forEach((r: any) => {
      const p = r.periodo?.substring(0, 7);
      if (p && monthlyMap.has(p)) {
        monthlyMap.set(p, (monthlyMap.get(p) || 0) + (r.neto || r.bruto || 0));
      }
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([key, amount]) => {
      const [year, month] = key.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return { month: d.toLocaleString("es-ES", { month: "short", year: "2-digit" }), amount };
    });

    const recentReceipts = (docs || []).map((d: any) => ({
      id: d.id,
      periodo: d.periodo || d.anio?.toString() || "",
      bruto: d.bruto || 0,
      retencion: d.retencion || 0,
      neto: d.neto || 0,
      path: d.path,
      nombre_mostrar: d.nombre_mostrar,
    }));

    const formattedLoans = loansData.map((l: any) => ({
      id: l.id,
      title: l.title || l.name || `Préstamo ${l.id.substring(0, 8)}`,
      principal: l.principal || 0,
      rate: l.rate || l.interest_rate || 0,
      start_date: l.start_date || l.created_at?.substring(0, 10) || "",
      end_date: l.end_date,
      total_paid: l.total_paid || 0,
    }));

    return NextResponse.json({
      totalInvested,
      totalEarnings,
      avgRate,
      nextPayment: null,
      thisMonthEarnings,
      monthlyData,
      loans: formattedLoans,
      recentReceipts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
