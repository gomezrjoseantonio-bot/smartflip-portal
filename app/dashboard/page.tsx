"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Doc = {
  id: string;
  investor_id: string;
  tipo: "recibo" | "resumen_anual" | "contrato";
  anio: number;
  path: string;
  nombre_mostrar: string;
  uploaded_at: string;
};

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [y, setY] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const supabase = getSupabase();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }
        setUserEmail(user.email || "");

        // RLS se encarga de filtrar por inversor
        let q = supabase.from("documents").select("*").order("uploaded_at", { ascending: false });
        if (y) q = q.eq("anio", Number(y));

        const { data, error } = await q;
        if (error) throw error;
        setDocs((data as Doc[]) || []);
      } catch (e: any) {
        setErr(e.message || "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [y]);

  const byYear = useMemo(() => {
    const s = new Se
