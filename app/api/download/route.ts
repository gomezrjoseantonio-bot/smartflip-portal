import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Esta ruta genera una URL firmada (60s) y te redirige al PDF.
// Usa la Service Role para evitar líos de RLS aquí (solo corre en servidor).
export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const service = process.env.SUPABASE_SERVICE_ROLE!;
    const supabase = createClient(url, service);

    const { data, error } = await supabase
      .storage
      .from("docs")
      .createSignedUrl(path, 60); // válido 60 segundos

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "Cannot sign URL" }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
