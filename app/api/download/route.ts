import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Fuerza runtime Node si Vercel intentase Edge por defecto
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const service = process.env.SUPABASE_SERVICE_ROLE!;
    const supabase = createClient(url, service);

    // Firma la URL
    const { data, error } = await supabase
      .storage.from("docs")
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "Cannot sign URL" }, { status: 500 });
    }

    // Verificación extra: si el objeto no existe, devuelve 404 claro
    const head = await fetch(data.signedUrl, { method: "HEAD" });
    if (!head.ok) {
      return NextResponse.json({ error: "Object not found in Storage", path }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
