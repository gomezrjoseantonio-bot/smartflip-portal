"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    try {
      setErr(null);
      const supabase = getSupabase();
      const r = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined"
            ? window.location.origin + "/dashboard"
            : undefined
        }
      });
      if (r.error) setErr(r.error.message);
      else setSent(true);
    } catch (e: any) {
      setErr(e.message || "Error");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h2>Acceso</h2>
      <p>Te enviamos un enlace mágico al correo.</p>
      <input
        placeholder="tu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button onClick={send}>Enviar enlace</button>
      {sent && <p>✅ Enlace enviado. Revisa tu email.</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
