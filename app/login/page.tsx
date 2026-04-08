"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Image from "next/image";
import { getSupabase } from "@/lib/supabaseClient";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!email) return;
    try {
      setErr(null);
      setLoading(true);
      const supabase = getSupabase();
      const r = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? window.location.origin + "/dashboard"
              : undefined,
        },
      });
      if (r.error) setErr(r.error.message);
      else setSent(true);
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4ECDC4]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#2ECC71]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-4">
              <Image src="/logo-smartflip.svg" alt="SmartFlip" width={80} height={80} className="drop-shadow-lg" />
            </div>
            <h1
              className="text-3xl font-black tracking-wider mb-1"
              style={{ background: "linear-gradient(135deg, #4ECDC4, #2ECC71)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              SMARTFLIP
            </h1>
            <p className="text-slate-400 text-sm">Portal de Inversores</p>
          </div>

          {!sent ? (
            <>
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block font-medium" style={{fontWeight:500}}>
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#4ECDC4] transition-colors"
                    style={{border:'1px solid #475569'}}
                  />
                </div>
              </div>

              <button
                onClick={send}
                disabled={loading || !email}
                className="w-full py-3 rounded-xl font-semibold text-slate-900 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #4ECDC4, #2ECC71)", border: "none", cursor: loading || !email ? "not-allowed" : "pointer" }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {loading ? "Enviando..." : "Enviar enlace mágico"}
              </button>

              {err && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {err}
                </div>
              )}

              <p className="text-center text-xs text-slate-500 mt-6">
                Recibirás un enlace seguro en tu correo para acceder al portal sin contraseña.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-white font-semibold text-lg mb-2">¡Enlace enviado!</h2>
              <p className="text-slate-400 text-sm">
                Revisa tu bandeja de entrada y haz clic en el enlace para acceder.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-[#4ECDC4] hover:underline"
                style={{background:'none',border:'none',cursor:'pointer'}}
              >
                ← Usar otro correo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
