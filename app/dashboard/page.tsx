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
    const s = new Set<string>();
    docs.forEach(d => s.add(String(d.anio)));
    return Array.from(s).sort().reverse();
  }, [docs]);

  // Plan B: firmar y abrir desde el cliente (evita 404 si /api/download no responde)
  const openSigned = async (d: Doc) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .storage.from("docs")
        .createSignedUrl(d.path, 60);
      if (error || !data?.signedUrl) throw new Error(error?.message || "No se pudo firmar la URL");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(e.message || "Error al abrir el documento");
    }
  };

  if (loading) return <div className="card"><p>Cargando…</p></div>;

  return (
    <div className="card">
      <h2>Documentos</h2>
      <p>Sesión: {userEmail}</p>

      <label>Filtrar por año</label>
      <select value={y} onChange={e => setY(e.target.value)}>
        <option value="">Todos</option>
        {byYear.map(yy => <option key={yy} value={yy}>{yy}</option>)}
      </select>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <ul>
        {docs.map(d => (
          <li key={d.id} style={{ marginBottom: 8 }}>
            {/* Enlace normal a la API del servidor */}
            <a
              href={`/api/download?path=${encodeURIComponent(d.path)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {d.nombre_mostrar}
            </a>
            <small> — {d.tipo} · {d.anio}</small>

            {/* Botón de respaldo: firmar y abrir desde el cliente */}
            <button style={{ marginLeft: 8 }} onClick={() => openSigned(d)}>
              Abrir (firmar)
            </button>

            {/* Depuración: muestra el path real que estamos usando */}
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              <code>path: {d.path}</code>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
