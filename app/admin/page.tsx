"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Investor = { id: string; email: string; nombre: string | null };

export default function Admin() {
  const [ok, setOk] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [tipo, setTipo] = useState<"recibo" | "resumen_anual" | "contrato">("recibo");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [investorId, setInvestorId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const role = (user.app_metadata as any)?.role;
      if (role !== "admin") { setOk(false); return; }

      setOk(true);
      const { data, error } = await supabase.from("investors")
        .select("id,email,nombre").order("email");
      if (!error && data) setInvestors(data as Investor[]);
    })();
  }, []);

  const upload = async () => {
    try {
      setErr(null);
      setStatus("Subiendo…");

      if (!ok) throw new Error("No autorizado");
      if (!file) throw new Error("Selecciona PDF");
      if (!investorId) throw new Error("Selecciona inversor");

      const supabase = getSupabase();

      const name = file.name.endsWith(".pdf") ? file.name : file.name + ".pdf";
      const path = `${investorId}/${tipo}/${anio}/${name}`;

      const up = await supabase.storage.from("docs").upload(path, file, { upsert: true });
      if (up.error) throw up.error;

      const ins = await supabase.from("documents").insert({
        investor_id: investorId, tipo, anio, path, nombre_mostrar: name
      });
      if (ins.error) throw ins.error;

      setStatus("✅ Subido y publicado");
      setFile(null);
    } catch (e: any) {
      setErr(e.message || "Error");
      setStatus("");
    }
  };

  if (!ok) return <div className="card"><h3>Admin</h3><p>No autorizado.</p></div>;

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <h2>Admin · Subir documento</h2>

      <label>Inversor</label>
      <select value={investorId} onChange={e => setInvestorId(e.target.value)}>
        <option value="">-- Selecciona --</option>
        {investors.map(i => (
          <option key={i.id} value={i.id}>
            {i.email}{i.nombre ? " · " + i.nombre : ""}
          </option>
        ))}
      </select>

      <label>Tipo</label>
      <select value={tipo} onChange={e => setTipo(e.target.value as any)}>
        <option value="recibo">Recibo</option>
        <option value="resumen_anual">Resumen anual</option>
        <option value="contrato">Contrato</option>
      </select>

      <label>Año</label>
      <input type="number" value={anio} onChange={e => setAnio(parseInt(e.target.value || "0"))} />

      <label>Archivo (PDF)</label>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />

      <div style={{ height: 8 }} />
      <button onClick={upload}>Subir</button>
      {status && <p>{status}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
