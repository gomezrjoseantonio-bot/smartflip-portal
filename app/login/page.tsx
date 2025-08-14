
"use client";
import { useState } from "react"; import { supabase } from "@/lib/supabaseClient";
export default function Login(){const [email,setEmail]=useState("");const [sent,setSent]=useState(false);const [err,setErr]=useState<string|null>(null);
const send=async()=>{setErr(null);const r=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:typeof window!=="undefined"?window.location.origin+"/dashboard":undefined}});if(r.error)setErr(r.error.message);else setSent(true);};
return (<div className="card" style={{maxWidth:420}}><h2>Acceso</h2><p>Te enviamos un enlace mágico.</p>
<label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/>
<div style={{height:8}}/><button onClick={send}>Enviar enlace</button>{sent&&<p>📩 Revisa tu correo.</p>}{err&&<p style={{color:"crimson"}}>{err}</p>}</div>);}
