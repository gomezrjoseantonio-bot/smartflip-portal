import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

async function getUserFromRequest(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await getServiceClient().auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServiceClient();
    const { data: investor } = await supabase
      .from("investors")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!investor) return NextResponse.json({ receipts: [] });

    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("investor_id", investor.id)
      .eq("tipo", "recibo")
      .order("uploaded_at", { ascending: false });

    const receipts = (docs || []).map((d: any) => ({
      id: d.id,
      periodo: d.periodo || d.anio?.toString() || "",
      bruto: d.bruto || 0,
      retencion: d.retencion || 0,
      neto: d.neto || 0,
      path: d.path,
      nombre_mostrar: d.nombre_mostrar,
    }));

    return NextResponse.json({ receipts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
